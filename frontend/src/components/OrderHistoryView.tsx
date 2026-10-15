import React, { useState } from 'react';
import { Package, RefreshCw, CheckCircle2, AlertTriangle, Clock, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Order } from '../types';

interface OrderHistoryViewProps {
  orders: Order[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  onRefresh,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-mint text-mint-text border border-mint-text/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>CONFIRMED</span>
          </span>
        );
      case 'PAYMENT_FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>PAYMENT_FAILED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>PENDING</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Order Microservice (Port 8002)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-ink-secondary font-mono">
              orders.db
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink-main mt-1 tracking-tight">
            Order Ledger & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            Persisted state retrieved directly from the Order Service SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-ink-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-border-subtle bg-white text-xs font-medium text-ink-main focus:outline-none focus:border-primary shadow-subtle w-60"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border-subtle text-xs font-bold text-ink-main hover:bg-slate-50 transition-colors shadow-subtle"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="mt-8 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-border-subtle shadow-subtle">
            <Package className="w-12 h-12 text-ink-secondary mx-auto opacity-30" />
            <h3 className="text-base font-bold text-ink-main mt-3">No orders found</h3>
            <p className="text-xs text-ink-secondary mt-1">
              Place an order from the Storefront or execute a simulated checkout.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="rounded-2xl bg-white border border-border-subtle shadow-subtle hover:border-slate-300 transition-all overflow-hidden"
            >
              {/* Order Header Row */}
              <div
                onClick={() => toggleExpand(order.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-border-subtle flex items-center justify-center text-ink-main shrink-0">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-ink-main">
                        {order.id}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="text-xs text-ink-secondary mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink-main">{order.customer_name}</span>
                      <span>•</span>
                      <span>{new Date(order.created_at).toLocaleString()}</span>
                      {order.payment_id && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-primary font-semibold">
                            Txn: {order.payment_id}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-border-subtle">
                  <div className="text-left md:text-right">
                    <div className="text-[11px] text-ink-secondary font-medium">Total Amount</div>
                    <div className="text-base font-extrabold text-ink-main">
                      ${order.total_amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-1 rounded-lg hover:bg-slate-200 text-ink-secondary">
                    {expandedOrderId === order.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Item Breakdown */}
              {expandedOrderId === order.id && (
                <div className="p-6 bg-[#FAFBFD] border-t border-border-subtle space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Items table */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-3">
                        Verified Order Items ({order.items.length})
                      </h4>
                      <div className="space-y-2">
                        {order.items.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-white border border-border-subtle text-xs"
                          >
                            <div>
                              <div className="font-bold text-ink-main">{item.product_name}</div>
                              <div className="text-[11px] text-ink-secondary font-mono">
                                SKU: {item.sku} • Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                              </div>
                            </div>
                            <span className="font-bold text-ink-main">
                              ${item.total_price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery & Financial Summary */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-secondary mb-2">
                          Shipping Address
                        </h4>
                        <div className="p-3 rounded-xl bg-white border border-border-subtle text-xs text-ink-secondary leading-relaxed">
                          <p className="font-bold text-ink-main">{order.customer_name}</p>
                          <p>{order.shipping_address}</p>
                          <p className="mt-1 font-mono text-[11px] text-primary">{order.customer_email}</p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white border border-border-subtle space-y-2 text-xs">
                        <div className="flex justify-between text-ink-secondary">
                          <span>Subtotal</span>
                          <span className="font-semibold text-ink-main">${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-ink-secondary">
                          <span>Tax (8.25%)</span>
                          <span className="font-semibold text-ink-main">${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-ink-secondary">
                          <span>Shipping</span>
                          <span className="font-semibold text-ink-main">
                            {order.shipping === 0 ? <span className="text-emerald-600">FREE</span> : `$${order.shipping.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-border-subtle flex justify-between font-extrabold text-sm text-ink-main">
                          <span>Total Amount</span>
                          <span>${order.total_amount.toFixed(2)} USD</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
};
