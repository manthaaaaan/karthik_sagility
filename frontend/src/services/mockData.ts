/**
 * Mock Data Layer — Sagility Demo
 * 
 * This module provides fallback data when backend microservices are unreachable
 * (e.g., deployed on Vercel without backends). When services ARE running locally,
 * real API calls take priority.
 */
import { Product, Order, Payment, ServiceHealth, OrderItem } from '../types';

// ─── Products (mirrors catalog service seed data exactly) ──────────────────
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    sku: 'SAG-KBD-01',
    name: 'Aura Mechanical Keyboard',
    tagline: 'Precision milled anodized aluminum with gasket-mounted tactility',
    description: 'Crafted from a solid block of 6063 aerospace aluminum, the Aura Keyboard features custom lubricated linear switches, seamless hot-swap support, and multi-layer sound dampening silicone.',
    category: 'Hardware',
    price: 289.00,
    stock: 18,
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1200&q=80',
    badge: 'Signature',
    rating: 4.96,
    reviews_count: 214
  },
  {
    id: 2,
    sku: 'SAG-AUD-02',
    name: 'Sonance Studio Monitors',
    tagline: 'Planar magnetic transducers with true spatial frequency curve',
    description: 'Engineered for uncompromising acoustic clarity, the Sonance Studio Monitors deliver neutral transient response across an ultra-wide 15Hz to 45kHz frequency range with zero phase distortion.',
    category: 'Audio',
    price: 449.00,
    stock: 12,
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1200&q=80',
    badge: 'Bestseller',
    rating: 4.92,
    reviews_count: 189
  },
  {
    id: 3,
    sku: 'SAG-ACC-03',
    name: 'Horizon MagSafe Charging Dock',
    tagline: 'Weighted matte ceramic base with 25W Qi2 fast inductive charging',
    description: 'Minimalist desk sculpture designed to power up your ecosystem simultaneously. Features micro-suction stabilization feet, woven braided cable, and precision heat dissipation chambers.',
    category: 'Desk Accessories',
    price: 129.00,
    stock: 35,
    image_url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=1200&q=80',
    badge: 'Popular',
    rating: 4.88,
    reviews_count: 94
  },
  {
    id: 4,
    sku: 'SAG-LGT-04',
    name: 'Lumen Sculpt Task Light',
    tagline: 'CRI 98+ full-spectrum daylight reproduction with gesture dimming',
    description: 'Eliminate eye strain with custom engineered micro-prism optics. Features infinite rotational balancing, color temperature tuning between 2700K and 6500K, and automatic ambient light sensing.',
    category: 'Lighting',
    price: 195.00,
    stock: 22,
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80',
    badge: 'Design Award',
    rating: 4.95,
    reviews_count: 162
  },
  {
    id: 5,
    sku: 'SAG-ACC-05',
    name: 'Vektor Precision Control Dial',
    tagline: 'Tactile haptic rotary encoder for timeline scrubbing & micro-adjustments',
    description: 'Integrates seamlessly with creative suites and developer tooling. Built-in OLED center display reflects active tool parameters with magnetic detents that adapt dynamically to software context.',
    category: 'Hardware',
    price: 175.00,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    badge: 'New',
    rating: 4.89,
    reviews_count: 78
  },
  {
    id: 6,
    sku: 'SAG-AUD-06',
    name: 'Aero Carbon Wireless Earbuds',
    tagline: 'Hybrid ANC with graphene drivers and carbon weave charging capsule',
    description: 'Sub-gram balance in each ear with 42dB active cancellation and dual beamforming voice arrays. Over 38 hours of total battery life with fast-charge case.',
    category: 'Audio',
    price: 219.00,
    stock: 29,
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=1200&q=80',
    badge: 'Staff Pick',
    rating: 4.91,
    reviews_count: 310
  },
  {
    id: 7,
    sku: 'SAG-ACC-07',
    name: 'Modena Tuscan Leather Desk Pad',
    tagline: 'Vegetable-tanned full grain leather with waterproof microsuede backing',
    description: 'Hand-stitched in Florence from full grain vegetable-tanned leather that develops a rich, distinct patina over decades. Optimized glide coefficient for both optical and laser sensors.',
    category: 'Desk Accessories',
    price: 115.00,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=80',
    badge: 'Handcrafted',
    rating: 4.97,
    reviews_count: 145
  },
  {
    id: 8,
    sku: 'SAG-LGT-08',
    name: 'Prism Linear Ambient Glow',
    tagline: 'Wall-projected indirect architectural lighting with fluid color scenes',
    description: 'Transforms your workspace ambiance with edge-lit diffusion panels and smart home connectivity. Smooth gradient blending with circadian rhythm scheduling.',
    category: 'Lighting',
    price: 160.00,
    stock: 19,
    image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80',
    badge: 'Atmospheric',
    rating: 4.87,
    reviews_count: 86
  }
];

// ─── Categories ────────────────────────────────────────────────────────────
export const MOCK_CATEGORIES: string[] = ['Hardware', 'Audio', 'Desk Accessories', 'Lighting'];

// ─── Sample Orders (pre-populated for demo) ────────────────────────────────
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-DEMO-001',
    customer_name: 'Sarah Jenkins',
    customer_email: 'sarah.jenkins@designcorp.io',
    shipping_address: '500 Howard Street, Suite 400, San Francisco, CA 94105',
    subtotal: 738.00,
    tax: 60.89,
    shipping: 0,
    total_amount: 798.89,
    status: 'CONFIRMED',
    payment_id: 'PAY-DEMO-001',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86000000).toISOString(),
    items: [
      { id: 1, product_id: 1, product_name: 'Aura Mechanical Keyboard', sku: 'SAG-KBD-01', unit_price: 289.00, quantity: 1, total_price: 289.00 },
      { id: 2, product_id: 2, product_name: 'Sonance Studio Monitors', sku: 'SAG-AUD-02', unit_price: 449.00, quantity: 1, total_price: 449.00 }
    ]
  },
  {
    id: 'ORD-DEMO-002',
    customer_name: 'Marcus Chen',
    customer_email: 'marcus.c@techflow.dev',
    shipping_address: '1 Infinite Loop, Cupertino, CA 95014',
    subtotal: 370.00,
    tax: 30.53,
    shipping: 0,
    total_amount: 400.53,
    status: 'CONFIRMED',
    payment_id: 'PAY-DEMO-002',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172400000).toISOString(),
    items: [
      { id: 3, product_id: 4, product_name: 'Lumen Sculpt Task Light', sku: 'SAG-LGT-04', unit_price: 195.00, quantity: 1, total_price: 195.00 },
      { id: 4, product_id: 5, product_name: 'Vektor Precision Control Dial', sku: 'SAG-ACC-05', unit_price: 175.00, quantity: 1, total_price: 175.00 }
    ]
  }
];

// ─── Mock Health (simulated "demo mode") ───────────────────────────────────
export const MOCK_HEALTH: Record<string, ServiceHealth> = {
  catalog: {
    service: 'catalog-service',
    port: 8001,
    status: 'ok',
    database: 'connected',
    database_type: 'SQLite (catalog.db)',
    uptime_seconds: 3600,
    latency_ms: 12
  },
  order: {
    service: 'order-service',
    port: 8002,
    status: 'ok',
    database: 'connected',
    database_type: 'SQLite (orders.db)',
    uptime_seconds: 3600,
    latency_ms: 8
  },
  payment: {
    service: 'payment-service',
    port: 8003,
    status: 'ok',
    database: 'connected',
    database_type: 'SQLite (payments.db)',
    uptime_seconds: 3600,
    latency_ms: 15
  }
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Simulate async network latency for realistic feel (50-200ms) */
export const simulateLatency = (min = 50, max = 200): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));

/** Filter products client-side, mirroring backend search logic */
export const filterMockProducts = (search?: string, category?: string): Product[] => {
  let filtered = [...MOCK_PRODUCTS];

  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.tagline && p.tagline.toLowerCase().includes(q))
    );
  }

  return filtered;
};

/** Generate a mock order from cart items */
export const createMockOrder = (
  customerName: string,
  customerEmail: string,
  shippingAddress: string,
  items: { product_id: number; quantity: number }[]
): Order => {
  const orderItems: OrderItem[] = items.map((item, idx) => {
    const product = MOCK_PRODUCTS.find(p => p.id === item.product_id)!;
    return {
      id: idx + 1,
      product_id: item.product_id,
      product_name: product.name,
      sku: product.sku,
      unit_price: product.price,
      quantity: item.quantity,
      total_price: product.price * item.quantity
    };
  });

  const subtotal = orderItems.reduce((acc, i) => acc + i.total_price, 0);
  const tax = parseFloat((subtotal * 0.0825).toFixed(2));
  const shipping = subtotal >= 100 ? 0 : 15;

  return {
    id: `ORD-${Date.now().toString(36).toUpperCase()}`,
    customer_name: customerName,
    customer_email: customerEmail,
    shipping_address: shippingAddress,
    subtotal,
    tax,
    shipping,
    total_amount: parseFloat((subtotal + tax + shipping).toFixed(2)),
    status: 'PENDING',
    created_at: new Date().toISOString(),
    items: orderItems
  };
};

/** Generate a mock payment result */
export const createMockPayment = (
  orderId: string,
  amount: number,
  idempotencyKey: string,
  simulateFailure: boolean
): Payment => {
  const failed = simulateFailure;
  return {
    id: `PAY-${Date.now().toString(36).toUpperCase()}`,
    order_id: orderId,
    amount,
    currency: 'USD',
    status: failed ? 'FAILED' : 'SUCCESS',
    idempotency_key: idempotencyKey,
    payment_method: 'card_visa_4242',
    failure_reason: failed ? 'Simulated payment decline (demo mode)' : undefined,
    created_at: new Date().toISOString(),
    is_idempotent_replay: false
  };
};

// ─── Demo mode state ──────────────────────────────────────────────────────
// In-memory order storage for demo mode (orders placed during session)
let demoOrders: Order[] = [...MOCK_ORDERS];

export const getDemoOrders = (): Order[] => [...demoOrders];

export const addDemoOrder = (order: Order): void => {
  demoOrders = [order, ...demoOrders];
};

export const updateDemoOrderStatus = (orderId: string, status: Order['status'], paymentId?: string): void => {
  demoOrders = demoOrders.map(o =>
    o.id === orderId
      ? { ...o, status, payment_id: paymentId ?? o.payment_id, updated_at: new Date().toISOString() }
      : o
  );
};
