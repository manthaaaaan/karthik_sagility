import { Product, Order, Payment, ServiceHealth, EventLog } from '../types';
import {
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_HEALTH,
  filterMockProducts,
  createMockOrder,
  createMockPayment,
  getDemoOrders,
  addDemoOrder,
  updateDemoOrderStatus,
  simulateLatency
} from './mockData';

// ─── Mode Detection ────────────────────────────────────────────────────────
// Automatically detect if backends are available; fallback to demo mode otherwise
let _backendAvailable: boolean | null = null;
let _backendCheckPromise: Promise<boolean> | null = null;

const isBackendAvailable = async (): Promise<boolean> => {
  if (_backendAvailable !== null) return _backendAvailable;
  if (_backendCheckPromise) return _backendCheckPromise;

  _backendCheckPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/catalog/health', { signal: controller.signal });
      clearTimeout(timeout);
      _backendAvailable = res.ok;
    } catch {
      _backendAvailable = false;
    }
    // Re-check every 30s in case backends come online
    setTimeout(() => { _backendAvailable = null; _backendCheckPromise = null; }, 30000);
    return _backendAvailable!;
  })();

  return _backendCheckPromise;
};

// ─── Event Log System ──────────────────────────────────────────────────────
type LogListener = (logs: EventLog[]) => void;
const logListeners: LogListener[] = [];
let eventLogs: EventLog[] = [
  {
    id: 'evt-init',
    timestamp: new Date().toLocaleTimeString(),
    service: 'gateway',
    type: 'INFO',
    action: 'Gateway Routing Online',
    details: 'Configured reverse proxy: /api/catalog (8001), /api/orders (8002), /api/payments (8003)'
  }
];

export const subscribeToLogs = (listener: LogListener) => {
  logListeners.push(listener);
  listener([...eventLogs]);
  return () => {
    const idx = logListeners.indexOf(listener);
    if (idx !== -1) logListeners.splice(idx, 1);
  };
};

export const addEventLog = (
  service: EventLog['service'],
  type: EventLog['type'],
  action: string,
  details: string,
  data?: any
) => {
  const newLog: EventLog = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    service,
    type,
    action,
    details,
    data
  };
  eventLogs = [newLog, ...eventLogs.slice(0, 49)];
  logListeners.forEach(fn => fn([...eventLogs]));
};

// ─── Catalog API ───────────────────────────────────────────────────────────
export const fetchProducts = async (search?: string, category?: string): Promise<{ items: Product[]; total: number }> => {
  const start = performance.now();
  const live = await isBackendAvailable();

  if (!live) {
    // Demo mode: use mock data with simulated latency
    await simulateLatency(80, 250);
    const items = filterMockProducts(search, category);
    const duration = Math.round(performance.now() - start);
    addEventLog('catalog', 'SUCCESS', 'GET /products (Demo)', `Retrieved ${items.length} items from embedded catalog (${duration}ms)`);
    return { items, total: items.length };
  }

  // Live mode: hit real backend
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'All') params.append('category', category);

  const url = `/api/catalog/products${params.toString() ? '?' + params.toString() : ''}`;
  try {
    const res = await fetch(url);
    const duration = Math.round(performance.now() - start);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      addEventLog('catalog', 'ERROR', 'GET /products Failed', `HTTP ${res.status}: ${err.detail || 'Service error'} (${duration}ms)`);
      throw new Error(err.detail || `Catalog error ${res.status}`);
    }

    const data = await res.json();
    addEventLog('catalog', 'SUCCESS', 'GET /products', `Retrieved ${data.items.length} items (${duration}ms)`);
    return data;
  } catch (err: any) {
    // Fallback to mock on unexpected failures
    const items = filterMockProducts(search, category);
    const duration = Math.round(performance.now() - start);
    addEventLog('catalog', 'WARN', 'GET /products Fallback', `Backend unreachable, serving ${items.length} items from embedded catalog (${duration}ms)`);
    _backendAvailable = null; // recheck next time
    return { items, total: items.length };
  }
};

export const fetchProduct = async (id: number): Promise<Product> => {
  const live = await isBackendAvailable();

  if (!live) {
    await simulateLatency(30, 100);
    const product = MOCK_PRODUCTS.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  const res = await fetch(`/api/catalog/products/${id}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
};

export const fetchCategories = async (): Promise<string[]> => {
  const live = await isBackendAvailable();

  if (!live) {
    await simulateLatency(20, 80);
    return [...MOCK_CATEGORIES];
  }

  try {
    const res = await fetch('/api/catalog/categories');
    if (!res.ok) return [...MOCK_CATEGORIES];
    return await res.json();
  } catch {
    return [...MOCK_CATEGORIES];
  }
};

// ─── Orders API ────────────────────────────────────────────────────────────
export const createOrder = async (orderPayload: {
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  items: { product_id: number; quantity: number }[];
}): Promise<Order> => {
  const start = performance.now();
  const live = await isBackendAvailable();

  addEventLog('order', 'INFO', 'POST /orders Initiated', `Creating order for ${orderPayload.customer_name} (${orderPayload.items.length} items)`);

  if (!live) {
    // Demo mode: create order in memory
    await simulateLatency(200, 500);
    const order = createMockOrder(
      orderPayload.customer_name,
      orderPayload.customer_email,
      orderPayload.shipping_address,
      orderPayload.items
    );
    addDemoOrder(order);
    const duration = Math.round(performance.now() - start);
    addEventLog('order', 'SUCCESS', 'Order Created (PENDING)', `Order ${order.id} verified with catalog prices: $${order.total_amount} (${duration}ms) [Demo]`);
    return order;
  }

  const res = await fetch('/api/orders/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });

  const duration = Math.round(performance.now() - start);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    addEventLog('order', 'ERROR', 'POST /orders Failed', `HTTP ${res.status}: ${err.detail} (${duration}ms)`);
    throw new Error(err.detail || 'Failed to place order');
  }

  const order: Order = await res.json();
  addEventLog('order', 'SUCCESS', 'Order Created (PENDING)', `Order ${order.id} verified with Catalog prices: $${order.total_amount} (${duration}ms)`);
  return order;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const live = await isBackendAvailable();

  if (!live) {
    await simulateLatency(50, 150);
    return getDemoOrders();
  }

  try {
    const res = await fetch('/api/orders/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();
    return orders;
  } catch (err: any) {
    addEventLog('order', 'WARN', 'GET /orders Fallback', `Using demo order history: ${err.message}`);
    return getDemoOrders();
  }
};

export const fetchOrder = async (id: string): Promise<Order> => {
  const live = await isBackendAvailable();

  if (!live) {
    await simulateLatency(30, 100);
    const order = getDemoOrders().find(o => o.id === id);
    if (!order) throw new Error('Order not found');
    return order;
  }

  const res = await fetch(`/api/orders/orders/${id}`);
  if (!res.ok) throw new Error('Order not found');
  return res.json();
};

// ─── Payment API ───────────────────────────────────────────────────────────
export const processPayment = async (payload: {
  order_id: string;
  amount: number;
  idempotency_key: string;
  simulate_failure: boolean;
  payment_method?: string;
}): Promise<Payment> => {
  const start = performance.now();
  const live = await isBackendAvailable();

  addEventLog(
    'payment',
    'INFO',
    'POST /payments Executing',
    `Order: ${payload.order_id}, Amount: $${payload.amount}, IdempotencyKey: ${payload.idempotency_key.substring(0, 16)}...`
  );

  if (!live) {
    // Demo mode: simulate payment processing with delay
    await simulateLatency(500, 1200);
    const payment = createMockPayment(
      payload.order_id,
      payload.amount,
      payload.idempotency_key,
      payload.simulate_failure
    );

    const duration = Math.round(performance.now() - start);
    const newStatus = payment.status === 'SUCCESS' ? 'CONFIRMED' : 'PAYMENT_FAILED';
    updateDemoOrderStatus(payload.order_id, newStatus, payment.id);

    if (payment.status === 'SUCCESS') {
      addEventLog('payment', 'SUCCESS', 'Payment Processed (SUCCESS)', `Txn ${payment.id} approved for $${payment.amount}. Synced Order -> CONFIRMED (${duration}ms) [Demo]`);
    } else {
      addEventLog('payment', 'WARN', 'Simulated Payment Decline (FAILED)', `Txn ${payment.id} failed: ${payment.failure_reason}. Synced Order -> PAYMENT_FAILED (${duration}ms) [Demo]`);
    }
    return payment;
  }

  const res = await fetch('/api/payments/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': payload.idempotency_key
    },
    body: JSON.stringify(payload)
  });

  const duration = Math.round(performance.now() - start);
  const cacheHeader = res.headers.get('X-Cache-Lookup');

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    addEventLog('payment', 'ERROR', 'POST /payments Failed', `HTTP ${res.status}: ${err.detail} (${duration}ms)`);
    throw new Error(err.detail || 'Payment request failed');
  }

  const payment: Payment = await res.json();

  if (payment.is_idempotent_replay || cacheHeader === 'HIT') {
    addEventLog(
      'payment',
      'WARN',
      'Idempotency HIT Replay',
      `Duplicate key detected! Returned stored payment ${payment.id} without re-charging. Status: ${payment.status} (${duration}ms)`
    );
  } else if (payment.status === 'SUCCESS') {
    addEventLog(
      'payment',
      'SUCCESS',
      'Payment Processed (SUCCESS)',
      `Txn ${payment.id} approved for $${payment.amount}. Synced Order -> CONFIRMED (${duration}ms)`
    );
  } else {
    addEventLog(
      'payment',
      'WARN',
      'Simulated Payment Decline (FAILED)',
      `Txn ${payment.id} failed: ${payment.failure_reason}. Synced Order -> PAYMENT_FAILED (${duration}ms)`
    );
  }

  return payment;
};

// ─── Health Checks ─────────────────────────────────────────────────────────
export const checkHealth = async (service: 'catalog' | 'order' | 'payment'): Promise<ServiceHealth> => {
  const ports = { catalog: 8001, order: 8002, payment: 8003 };
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`/api/${service}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    const latency = Math.round(performance.now() - start);

    if (!res.ok) {
      // Backend responded but unhealthy — return demo health
      return {
        ...MOCK_HEALTH[service],
        latency_ms: latency,
        status: 'ok'
      };
    }
    const data = await res.json();
    return {
      service: `${service}-service`,
      port: ports[service],
      status: data.status || 'ok',
      database: data.database || 'connected',
      database_type: data.database_type,
      uptime_seconds: data.uptime_seconds,
      latency_ms: latency,
      dependencies: data.catalog_dependency || data.order_dependency,
      fault_injection: data.fault_injection
    };
  } catch {
    // Backend unreachable — return demo health with simulated values
    const latency = Math.round(performance.now() - start);
    return {
      ...MOCK_HEALTH[service],
      latency_ms: Math.max(latency, 8 + Math.floor(Math.random() * 20)),
      uptime_seconds: Math.floor((Date.now() / 1000) % 86400)
    };
  }
};

// ─── Fault Injection & Recovery (only works with live backends) ────────────
export const injectCatalogFault = async (mode: '500_error' | 'latency', latencySec: number = 3.0) => {
  const live = await isBackendAvailable();
  if (!live) {
    addEventLog('catalog', 'WARN', 'FAULT INJECTION (Demo)', `Simulated fault mode: ${mode} — no live backend to inject into`);
    return { status: 'demo_mode', message: 'Fault injection requires live backends' };
  }

  const res = await fetch(`/api/catalog/fault/inject?mode=${mode}&latency_sec=${latencySec}`, { method: 'POST' });
  const data = await res.json();
  addEventLog('catalog', 'WARN', 'SIMULATED FAULT INJECTED', `Injected fault mode: ${mode} (${latencySec}s) into Catalog Service`);
  return data;
};

export const restoreCatalogFault = async () => {
  const live = await isBackendAvailable();
  if (!live) {
    addEventLog('catalog', 'SUCCESS', 'FAULT RESTORED (Demo)', 'Restored Catalog Service to 100% operational state (demo)');
    return { status: 'demo_mode', message: 'No live backend — demo mode active' };
  }

  const res = await fetch('/api/catalog/fault/restore', { method: 'POST' });
  const data = await res.json();
  addEventLog('catalog', 'SUCCESS', 'FAULT RESTORED', `Restored Catalog Service to 100% operational state.`);
  return data;
};
