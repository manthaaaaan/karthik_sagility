export interface Product {
  id: number;
  sku: string;
  name: string;
  tagline?: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  badge?: string;
  rating: number;
  reviews_count: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PAYMENT_FAILED';
  payment_id?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED';
  idempotency_key: string;
  payment_method: string;
  failure_reason?: string;
  created_at: string;
  is_idempotent_replay?: boolean;
}

export interface ServiceHealth {
  service: string;
  port: number;
  status: 'ok' | 'degraded' | 'unhealthy' | 'offline';
  database: string;
  database_type?: string;
  uptime_seconds?: number;
  latency_ms?: number;
  dependencies?: Record<string, any>;
  fault_injection?: {
    active: boolean;
    mode: string | null;
    latency_seconds: number;
  };
}

export interface EventLog {
  id: string;
  timestamp: string;
  service: 'gateway' | 'catalog' | 'order' | 'payment' | 'client';
  type: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  action: string;
  details: string;
  data?: any;
}
