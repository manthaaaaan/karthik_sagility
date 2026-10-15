import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.0825;
  const shipping = subtotal === 0 ? 0 : subtotal >= 100 ? 0 : 15.0;
  const total = subtotal + tax + shipping;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink-main/40 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-border-subtle shadow-floating flex flex-col justify-between animate-slide-up">
          
          {/* Header */}
          <div className="p-6 border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-ink-main">Your Shopping Bag</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-ink-secondary">
                {items.reduce((acc, i) => acc + i.quantity, 0)} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-ink-secondary hover:text-ink-main transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-border-subtle flex items-center justify-center text-ink-secondary">
                  <ShoppingBag className="w-8 h-8 opacity-40" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink-main">Your cart is empty</h3>
                  <p className="text-xs text-ink-secondary mt-1 max-w-xs">
                    Browse our curated hardware catalog to add items to your checkout.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-subtle"
                >
                  Start Exploring
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3.5 rounded-xl bg-surface border border-border-subtle shadow-subtle"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-18 h-18 rounded-lg object-cover bg-slate-100 border border-border-subtle shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-ink-main line-clamp-1">
                          {product.name}
                        </h4>
                        <div className="text-[11px] text-ink-secondary mt-0.5">
                          ${product.price.toFixed(2)} each
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveItem(product.id)}
                        className="text-ink-secondary hover:text-rose-500 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {/* Qty +/- */}
                      <div className="flex items-center border border-border-subtle rounded-lg bg-slate-50 p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-ink-secondary hover:text-ink-main font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-ink-main">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-ink-secondary hover:text-ink-main font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-extrabold text-ink-main">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {items.length > 0 && (
            <div className="p-6 border-t border-border-subtle bg-[#FAFBFD] space-y-4">
              
              {/* Shipping incentive */}
              {subtotal < 100 ? (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Add <strong>${(100 - subtotal).toFixed(2)}</strong> more to qualify for Free Shipping!</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-mint/40 border border-mint text-[11px] text-mint-text flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>You've unlocked <strong>Free Standard Shipping</strong>!</span>
                </div>
              )}

              {/* Price summary */}
              <div className="space-y-1.5 text-xs text-ink-secondary">
                <div className="flex justify-between">
                  <span>Catalog Subtotal</span>
                  <span className="font-semibold text-ink-main">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8.25%)</span>
                  <span className="font-semibold text-ink-main">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-ink-main">
                    {shipping === 0 ? <span className="text-emerald-600">FREE</span> : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-border-subtle flex justify-between text-sm font-extrabold text-ink-main">
                  <span>Total (USD)</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                id="drawer-proceed-checkout"
                onClick={onProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover active:scale-[0.99] transition-all shadow-subtle"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-ink-secondary">
                Prices and inventory verified in real time via Catalog Service (8001)
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
