import React, { useState } from 'react';
import { X, Star, ShoppingBag, Check, Shield, Truck, RotateCcw } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-main/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-floating border border-border-subtle overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-ink-secondary hover:text-ink-main border border-border-subtle transition-colors shadow-subtle"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto bg-[#F0F3F7]">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.badge && (
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur text-ink-main border border-border-subtle shadow-xs">
                  {product.badge}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-ink-secondary mb-2">
                <span className="font-bold uppercase tracking-wider text-primary">
                  {product.category}
                </span>
                <span className="font-mono text-[11px] text-ink-secondary">
                  SKU: {product.sku}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-ink-main">
                {product.name}
              </h2>

              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <span className="text-xs font-bold text-ink-main">{product.rating}</span>
                <span className="text-xs text-ink-secondary">({product.reviews_count} verified reviews)</span>
              </div>

              <div className="mt-4 text-2xl font-extrabold text-ink-main">
                ${product.price.toFixed(2)}
              </div>

              <p className="mt-4 text-xs sm:text-sm text-ink-secondary leading-relaxed">
                {product.description}
              </p>

              {/* Guarantees */}
              <div className="mt-6 pt-4 border-t border-border-subtle grid grid-cols-2 gap-3 text-xs text-ink-secondary">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>Free Express Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2-Year Warranty</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-4 border-t border-border-subtle flex items-center gap-3">
              {/* Qty Counter */}
              <div className="flex items-center border border-border-subtle rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-7 h-7 flex items-center justify-center text-ink-secondary hover:text-ink-main font-bold text-sm"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-ink-main">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-7 h-7 flex items-center justify-center text-ink-secondary hover:text-ink-main font-bold text-sm"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-subtle ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary text-white hover:bg-primary-hover active:scale-95'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart • ${(product.price * qty).toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
