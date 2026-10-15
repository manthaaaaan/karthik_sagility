import React, { useState } from 'react';
import { ShoppingBag, Star, Check, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onQuickView
}) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge?.toLowerCase()) {
      case 'signature':
        return 'bg-lavender text-lavender-text border-lavender-text/20';
      case 'bestseller':
        return 'bg-mint text-mint-text border-mint-text/20';
      case 'new':
        return 'bg-blue-50 text-primary border-primary/20';
      default:
        return 'bg-slate-100 text-ink-main border-slate-200';
    }
  };

  return (
    <div
      onClick={() => onQuickView(product)}
      className="group relative flex flex-col rounded-2xl bg-surface border border-border-subtle p-4 shadow-subtle hover:shadow-elevated hover:border-slate-300 transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F0F3F7]">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(product.badge)} shadow-xs`}>
              {product.badge}
            </span>
          </div>
        )}

        {/* Quick View Floating Button */}
        <div className="absolute inset-0 bg-ink-main/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur text-ink-main text-xs font-bold shadow-floating hover:bg-white active:scale-95 transition-transform"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 flex flex-1 flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-ink-secondary mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-primary">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-ink-main">{product.rating}</span>
              <span className="text-[11px]">({product.reviews_count})</span>
            </div>
          </div>

          {/* Title & Tagline */}
          <h3 className="text-base font-bold text-ink-main group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-ink-secondary line-clamp-2 leading-relaxed">
            {product.tagline || product.description}
          </p>
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-ink-secondary">Catalog Price</div>
            <div className="text-lg font-extrabold text-ink-main">
              ${product.price.toFixed(2)}
            </div>
          </div>

          <button
            id={`add-to-cart-${product.id}`}
            onClick={handleAdd}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-subtle ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-primary text-white hover:bg-primary-hover'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 animate-bounce" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
