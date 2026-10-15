import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Layers, 
  RefreshCw, 
  AlertCircle, 
  SlidersHorizontal,
  PackageCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Product, CartItem, Order, Payment, ServiceHealth } from './types';
import { 
  fetchProducts, 
  fetchCategories, 
  fetchOrders, 
  checkHealth,
  addEventLog 
} from './services/api';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderHistoryView } from './components/OrderHistoryView';
import { ArchitectureView } from './components/ArchitectureView';
import { Toast, ToastMessage } from './components/Toast';

export function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'store' | 'orders' | 'architecture'>('store');
  const catalogSectionRef = useRef<HTMLDivElement>(null);

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Cart & Modals
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);

  // Health Map State
  const [healthMap, setHealthMap] = useState<{ [key: string]: ServiceHealth | null }>({
    catalog: null,
    order: null,
    payment: null
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string, description?: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message, description }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Poll service health
  const refreshAllHealth = async () => {
    try {
      const [cHealth, oHealth, pHealth] = await Promise.all([
        checkHealth('catalog'),
        checkHealth('order'),
        checkHealth('payment')
      ]);
      setHealthMap({
        catalog: cHealth,
        order: oHealth,
        payment: pHealth
      });
    } catch (err) {
      console.error('Failed to poll health:', err);
    }
  };

  // Load products from Catalog microservice
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    setCatalogError(null);
    try {
      const res = await fetchProducts(searchQuery, selectedCategory);
      setProducts(res.items);
    } catch (err: any) {
      setCatalogError(err.message || 'Unable to connect to Catalog microservice');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(['All', ...cats]);
    } catch (err) {
      setCategories(['All', 'Hardware', 'Audio', 'Desk Accessories', 'Lighting']);
    }
  };

  // Load orders
  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const list = await fetchOrders();
      setOrders(list);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Initial mount
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadOrders();
    refreshAllHealth();

    const interval = setInterval(refreshAllHealth, 12000);
    return () => clearInterval(interval);
  }, []);

  // Re-fetch products when search or category changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    addToast('success', 'Added to Cart', `${product.name} (Qty: ${quantity})`);
    addEventLog('client', 'INFO', 'Cart Updated', `Added ${product.name} to cart`);
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleOrderCompleted = (order: Order, payment: Payment) => {
    setCartItems([]);
    loadOrders();
    if (payment.status === 'SUCCESS') {
      addToast('success', 'Order Placed Successfully!', `Order ID: ${order.id}`);
    } else {
      addToast('error', 'Payment Failed', `Simulated decline on Order ${order.id}`);
    }
  };

  const scrollToCatalog = () => {
    setActiveTab('store');
    setTimeout(() => {
      catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink-main">
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Global Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        openCart={() => setIsCartOpen(true)}
        healthMap={healthMap}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* VIEW 1: STOREFRONT */}
        {activeTab === 'store' && (
          <div>
            {/* Editorial Hero */}
            <Hero
              onExplore={scrollToCatalog}
              onViewArchitecture={() => setActiveTab('architecture')}
              healthMap={healthMap}
            />

            {/* Catalog Section */}
            <div ref={catalogSectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              
              {/* Section Header & Filters */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-subtle">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">
                    Live Product Catalog • Port 8001
                  </div>
                  <h2 className="text-3xl font-extrabold text-ink-main mt-1 tracking-tight">
                    Curated Hardware & Workspace Essentials
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                    Direct from SQLite <code>catalog.db</code> with real-time stock and prices.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-ink-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="product-search-input"
                    type="text"
                    placeholder="Search products, switch types, specs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-subtle bg-white text-xs font-medium text-ink-main placeholder:text-ink-secondary focus:outline-none focus:border-primary shadow-subtle transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-secondary hover:text-ink-main font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-xs font-bold text-ink-secondary flex items-center gap-1.5 mr-2 shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Category:</span>
                </span>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all shadow-xs ${
                      selectedCategory === cat
                        ? 'bg-ink-main text-white shadow-subtle'
                        : 'bg-white text-ink-secondary hover:text-ink-main border border-border-subtle hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Grid / Error / Skeletons */}
              <div className="mt-10">
                {catalogError ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-rose-200 shadow-subtle space-y-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-ink-main">
                        Catalog Service Unavailable
                      </h3>
                      <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">
                        {catalogError}
                      </p>
                    </div>
                    <button
                      onClick={loadProducts}
                      className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-subtle"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : isLoadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <div key={i} className="rounded-2xl bg-white border border-border-subtle p-4 space-y-4 animate-pulse">
                        <div className="aspect-[4/3] rounded-xl bg-slate-200" />
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-6 bg-slate-200 rounded w-1/3 pt-4" />
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-border-subtle shadow-subtle">
                    <h3 className="text-base font-bold text-ink-main">No products found</h3>
                    <p className="text-xs text-ink-secondary mt-1">
                      Try adjusting your search criteria or selecting a different category.
                    </p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                      className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-ink-main transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onQuickView={setSelectedProduct}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: ORDERS HISTORY */}
        {activeTab === 'orders' && (
          <OrderHistoryView
            orders={orders}
            onRefresh={loadOrders}
            isLoading={isLoadingOrders}
          />
        )}

        {/* VIEW 3: ARCHITECTURE & CLOUD-NATIVE TOPOLOGY */}
        {activeTab === 'architecture' && (
          <ArchitectureView
            healthMap={healthMap}
            onRefreshHealth={refreshAllHealth}
            onNavigateToStore={() => setActiveTab('store')}
          />
        )}

      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Product Quick View Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Multi-Service Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-ink-secondary">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">
              S
            </div>
            <div>
              <span className="font-bold text-ink-main">Sagility Demo</span> — Intelligent Commerce. Seamlessly Connected.
            </div>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <button onClick={() => setActiveTab('store')} className="hover:text-ink-main">Storefront</button>
            <button onClick={() => setActiveTab('orders')} className="hover:text-ink-main">Order Ledger</button>
            <button onClick={() => setActiveTab('architecture')} className="hover:text-ink-main">Architecture Topology</button>
            <span className="font-mono text-[11px] text-primary">FastAPI + SQLite + Nginx</span>
          </div>

          <div>
            Built for Technical Evaluation • Sagility Technical Demo
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
