import React from 'react';
import { ArrowRight, Layers, ShieldCheck, Zap, RefreshCw, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { ServiceHealth } from '../types';

interface HeroProps {
  onExplore: () => void;
  onViewArchitecture: () => void;
  healthMap: { [key: string]: ServiceHealth | null };
}

export const Hero: React.FC<HeroProps> = ({
  onExplore,
  onViewArchitecture,
  healthMap
}) => {
  return (
    <div className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-border-subtle bg-canvas">
      {/* Ambient gradient meshes */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 ambient-glow pointer-events-none" />
      <div className="absolute inset-0 ambient-dot-grid opacity-60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-border-subtle shadow-subtle text-xs font-semibold text-ink-main">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Technical Project Evaluation Build</span>
              <span className="text-ink-secondary">•</span>
              <span className="text-primary font-bold">FastAPI + Nginx + SQLite</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink-main tracking-tight leading-[1.1]">
                Commerce, built to{' '}
                <span className="font-editorial italic font-normal text-primary">
                  work together.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-ink-secondary max-w-2xl font-normal leading-relaxed">
                Sagility Demo orchestrates three autonomous microservices via an Nginx API Gateway. 
                Engineered with trusted backend pricing, resilient service-to-service bounded retries, and strict payment idempotency.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                id="hero-explore-btn"
                onClick={onExplore}
                className="group flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all shadow-subtle"
              >
                <span>Explore Store</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="hero-architecture-btn"
                onClick={onViewArchitecture}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white border border-border-subtle text-ink-main font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-subtle"
              >
                <Layers className="w-4 h-4 text-primary" />
                <span>View Architecture</span>
              </button>
            </div>

            {/* Architectural Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border-subtle max-w-xl">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-main">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Idempotency</span>
                </div>
                <p className="text-[11px] text-ink-secondary mt-0.5">Strict duplicate protection</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-main">
                  <RefreshCw className="w-3.5 h-3.5 text-primary" />
                  <span>Bounded Retries</span>
                </div>
                <p className="text-[11px] text-ink-secondary mt-0.5">Exponential backoff</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-main">
                  <Database className="w-3.5 h-3.5 text-purple-600" />
                  <span>3 Databases</span>
                </div>
                <p className="text-[11px] text-ink-secondary mt-0.5">Isolated SQLite schemas</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Microservices Pulse Visualizer Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-white border border-border-subtle p-6 shadow-floating">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-main">
                    Live Cluster Topology
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-ink-secondary">
                  NGINX GATEWAY :80
                </span>
              </div>

              {/* Service Cards Stack */}
              <div className="mt-4 space-y-3 font-mono text-xs">
                
                {/* Catalog Service */}
                <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-border-subtle hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-sans font-semibold text-ink-main">
                      <Cpu className="w-4 h-4 text-primary" />
                      <span>Catalog Service</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-mint text-mint-text text-[11px] font-bold">
                      PORT 8001
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-secondary">
                    <span>SQLite: catalog.db</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {healthMap.catalog?.latency_ms ? `${healthMap.catalog.latency_ms}ms` : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Order Service */}
                <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-border-subtle hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-sans font-semibold text-ink-main">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Order Service</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-lavender text-lavender-text text-[11px] font-bold">
                      PORT 8002
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-secondary">
                    <span>SQLite: orders.db</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {healthMap.order?.latency_ms ? `${healthMap.order.latency_ms}ms` : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Payment Service */}
                <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-border-subtle hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-sans font-semibold text-ink-main">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Payment Service</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-mint text-mint-text text-[11px] font-bold">
                      PORT 8003
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-secondary">
                    <span>SQLite: payments.db</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {healthMap.payment?.latency_ms ? `${healthMap.payment.latency_ms}ms` : 'Active'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Bottom live stats footer */}
              <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-ink-secondary">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Real-time inter-service bus
                </span>
                <button
                  onClick={onViewArchitecture}
                  className="text-primary font-semibold hover:underline"
                >
                  Inspect Topology →
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
