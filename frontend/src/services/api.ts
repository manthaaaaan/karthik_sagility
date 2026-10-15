import { Product, Order, Payment, ServiceHealth, EventLog } from '../types';

// Event log listeners for live cloud-native architecture visualizer
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

// Catalog API
export const fetchProducts = async (search?: string, category?: string): Promise<{ items: Product[]; total: number }> => {
  const start = performance.now();
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
    if (!err.message?.includes('Catalog error')) {
      addEventLog('catalog', 'ERROR', 'GET /products Unreachable', `Connection refused or timeout to Catalog Service: ${err.message}`);
    }
    throw err;
  }
};

export const fetchProduct = async (id: number): Promise<Product> => {
  const res = await fetch(`/api/catalog/products/${id}`);
  if (!res.ok) throw new Error('Product not found');
  return res.json();
};

export const fetchCategories = async (): Promise<string[]> => {
  try {
    const res = await fetch('/api/catalog/categories');
    if (!res.ok) return ['Hardware', 'Audio', 'Desk Accessories', 'Lighting'];
    return await res.json();
  } catch {
    return ['Hardware', 'Audio', 'Desk Accessories', 'Lighting'];
  }
};

// Orders API
export const createOrder = async (orderPayload: {
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  items: { product_id: number; quantity: number }[];
}): Promise<Order> => {
  const start = performance.now();
  addEventLog('order', 'INFO', 'POST /orders Initiated', `Creating order for ${orderPayload.customer_name} (${orderPayload.items.length} items)`);

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
  try {
    const res = await fetch('/api/orders/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    const orders = await res.json();
    return orders;
  } catch (err: any) {
    addEventLog('order', 'ERROR', 'GET /orders', `Error: ${err.message}`);
    return [];
  }
};

export const fetchOrder = async (id: string): Promise<Order> => {
  const res = await fetch(`/api/orders/orders/${id}`);
  if (!res.ok) throw new Error('Order not found');
  return res.json();
};

// Payment API
export const processPayment = async (payload: {
  order_id: string;
  amount: number;
  idempotency_key: string;
  simulate_failure: boolean;
  payment_method?: string;
}): Promise<Payment> => {
  const start = performance.now();
  addEventLog(
    'payment',
    'INFO',
    'POST /payments Executing',
    `Order: ${payload.order_id}, Amount: $${payload.amount}, IdempotencyKey: ${payload.idempotency_key.substring(0, 16)}...`
  );

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

// Health Checks
export const checkHealth = async (service: 'catalog' | 'order' | 'payment'): Promise<ServiceHealth> => {
  const ports = { catalog: 8001, order: 8002, payment: 8003 };
  const start = performance.now();
  try {
    const res = await fetch(`/api/${service}/health`);
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return {
        service: `${service}-service`,
        port: ports[service],
        status: 'unhealthy',
        database: 'error',
        latency_ms: latency
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
  } catch (e: any) {
    return {
      service: `${service}-service`,
      port: ports[service],
      status: 'offline',
      database: 'disconnected',
      latency_ms: Math.round(performance.now() - start)
    };
  }
};

// Fault Injection & Recovery API
export const injectCatalogFault = async (mode: '500_error' | 'latency', latencySec: number = 3.0) => {
  const res = await fetch(`/api/catalog/fault/inject?mode=${mode}&latency_sec=${latencySec}`, { method: 'POST' });
  const data = await res.json();
  addEventLog('catalog', 'WARN', 'SIMULATED FAULT INJECTED', `Injected fault mode: ${mode} (${latencySec}s) into Catalog Service`);
  return data;
};

export const restoreCatalogFault = async () => {
  const res = await fetch('/api/catalog/fault/restore', { method: 'POST' });
  const data = await res.json();
  addEventLog('catalog', 'SUCCESS', 'FAULT RESTORED', `Restored Catalog Service to 100% operational state.`);
  return data;
};
