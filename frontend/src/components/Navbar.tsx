import React from 'react';
import { ShoppingBag, Server, Layers, PackageCheck, Activity, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ServiceHealth } from '../types';

interface NavbarProps {
  activeTab: 'store' | 'orders' | 'architecture';
  setActiveTab: (tab: 'store' | 'orders' | 'architecture') => void;
  cartCount: number;
  openCart: () => void;
  healthMap: { [key: string]: ServiceHealth | null };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  healthMap
}) => {
  const allServicesHealthy = Object.values(healthMap).every(h => h && h.status === 'ok');
  const anyDegraded = Object.values(healthMap).some(h => h && (h.status === 'degraded' || h.fault_injection?.active));

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-border-subtle transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand & Tag */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setActiveTab('store')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-subtle group-hover:scale-105 transition-transform duration-200">
              <span className="font-extrabold tracking-tight text-lg">S</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-ink-main">Sagility</span>
                <span className="text-xs px-2 py-0.5 font-semibold rounded-full bg-lavender text-lavender-text border border-lavender-text/20">
                  Demo
                </span>
              </div>
              <p className="text-xs text-ink-secondary hidden sm:block font-medium">Intelligent Commerce. Seamlessly Connected.</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F1F4F9] p-1 rounded-xl border border-border-subtle">
            <button
              onClick={() => setActiveTab('store')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                activeTab === 'store'
                  ? 'bg-white text-ink-main shadow-subtle'
                  : 'text-ink-secondary hover:text-ink-main'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span>Storefront</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                activeTab === 'orders'
                  ? 'bg-white text-ink-main shadow-subtle'
                  : 'text-ink-secondary hover:text-ink-main'
              }`}
            >
              <PackageCheck className="w-4 h-4 text-primary" />
              <span>Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
                activeTab === 'architecture'
                  ? 'bg-white text-ink-main shadow-subtle'
                  : 'text-ink-secondary hover:text-ink-main'
              }`}
            >
              <Layers className="w-4 h-4 text-primary" />
              <span>Architecture & Topology</span>
              {anyDegraded && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </nav>
        </div>

        {/* Right side controls: Health pill & Cart trigger */}
        <div className="flex items-center gap-3">
          {/* Microservices Cluster Health pill */}
          <button
            onClick={() => setActiveTab('architecture')}
            title="Click to view microservices topology"
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border-subtle shadow-subtle text-xs hover:border-primary/40 transition-colors"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${
              anyDegraded
                ? 'bg-amber-500 animate-ping'
                : allServicesHealthy
                ? 'bg-emerald-500'
                : 'bg-emerald-500'
            }`} />
            <span className="font-semibold text-ink-main">
              {anyDegraded ? 'Fault Injected (Degraded)' : 'Microservices 3/3 Healthy'}
            </span>
            <Activity className="w-3.5 h-3.5 text-ink-secondary" />
          </button>

          {/* Cart Drawer Trigger */}
          <button
            id="cart-trigger-btn"
            onClick={openCart}
            className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-ink-main text-white hover:bg-ink-main/90 active:scale-95 transition-all shadow-subtle"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm font-semibold hidden sm:inline">Cart</span>
            {cartCount > 0 ? (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-primary text-white rounded-full">
                {cartCount}
              </span>
            ) : (
              <span className="text-xs text-slate-300">0</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden border-t border-border-subtle bg-white px-4 py-2 justify-around">
        <button
          onClick={() => setActiveTab('store')}
          className={`flex items-center gap-1.5 py-1 text-xs font-semibold ${
            activeTab === 'store' ? 'text-primary' : 'text-ink-secondary'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Store</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 py-1 text-xs font-semibold ${
            activeTab === 'orders' ? 'text-primary' : 'text-ink-secondary'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Orders</span>
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-1.5 py-1 text-xs font-semibold ${
            activeTab === 'architecture' ? 'text-primary' : 'text-ink-secondary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Topology</span>
        </button>
      </div>
    </header>
  );
};
