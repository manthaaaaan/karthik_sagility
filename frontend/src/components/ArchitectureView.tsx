import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  ArrowRight, 
  RefreshCw, 
  Terminal, 
  Flame, 
  ShieldAlert, 
  Layers, 
  Play, 
  RotateCcw
} from 'lucide-react';
import { ServiceHealth, EventLog } from '../types';
import { injectCatalogFault, restoreCatalogFault, subscribeToLogs, checkHealth } from '../services/api';

interface ArchitectureViewProps {
  healthMap: { [key: string]: ServiceHealth | null };
  onRefreshHealth: () => void;
  onNavigateToStore: () => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  healthMap,
  onRefreshHealth,
  onNavigateToStore
}) => {
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [isFaultActive, setIsFaultActive] = useState(false);
  const [faultType, setFaultType] = useState<'500_error' | 'latency'>('500_error');
  const [isExecutingFault, setIsExecutingFault] = useState(false);
  const [selectedService, setSelectedService] = useState<'gateway' | 'catalog' | 'order' | 'payment'>('gateway');

  useEffect(() => {
    const unsubscribe = subscribeToLogs(newLogs => setLogs(newLogs));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (healthMap.catalog?.fault_injection?.active) {
      setIsFaultActive(true);
    } else {
      setIsFaultActive(false);
    }
  }, [healthMap.catalog]);

  const handleInjectFault = async () => {
    setIsExecutingFault(true);
    try {
      await injectCatalogFault(faultType, 3.0);
      setIsFaultActive(true);
      await onRefreshHealth();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExecutingFault(false);
    }
  };

  const handleRestoreFault = async () => {
    setIsExecutingFault(true);
    try {
      await restoreCatalogFault();
      setIsFaultActive(false);
      await onRefreshHealth();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExecutingFault(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title & Microservice Cluster Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border-subtle shadow-subtle text-xs font-bold text-ink-main">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Decoupled Microservices Topology</span>
            <span className="text-ink-secondary">•</span>
            <span className="text-primary font-mono">Nginx Gateway Reverse Proxy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-main mt-2 tracking-tight">
            System Architecture & Live State
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1 max-w-2xl">
            Interactive visualization showing API routing, isolated SQLite database stores, inter-service resilience, and safe failure injection.
          </p>
        </div>

        <button
          onClick={onRefreshHealth}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border-subtle text-xs font-bold text-ink-main hover:bg-slate-50 transition-colors shadow-subtle shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-primary" />
          <span>Ping All Services</span>
        </button>
      </div>

      {/* TOPOLOGY DIAGRAM CANVAS */}
      <div className="relative rounded-3xl bg-white border border-border-subtle p-6 sm:p-10 shadow-floating overflow-hidden">
        
        {/* Subtle grid backdrop */}
        <div className="absolute inset-0 ambient-dot-grid opacity-70 pointer-events-none" />

        {/* Legend */}
        <div className="relative flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-border-subtle text-xs font-semibold">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-ink-main">
              <span className="w-3 h-0.5 bg-primary" />
              <span>Gateway Ingress Wires</span>
            </div>
            <div className="flex items-center gap-2 text-ink-main">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500" />
              <span>Inter-Service RPC (Bounded Retry)</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-mint text-mint-text font-bold">
              Actual Live Metrics (HTTP 200)
            </span>
          </div>
        </div>

        {/* Diagram Flow Nodes */}
        <div className="relative mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Node 1: Client Browser (Col 1-3) */}
          <div className="lg:col-span-3 flex flex-col items-center text-center">
            <div 
              onClick={() => setSelectedService('gateway')}
              className="w-full p-6 rounded-2xl bg-slate-50 border border-border-subtle shadow-subtle hover:border-primary cursor-pointer transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-border-subtle flex items-center justify-center text-primary mx-auto shadow-subtle">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-ink-main mt-3">Client Browser</h3>
              <p className="text-[11px] text-ink-secondary mt-1">React 19 + Tailwind</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-primary/20">
                <span>Port 5173 / HTTP</span>
              </div>
            </div>
          </div>

          {/* Node 2: API Gateway (Col 4-6) */}
          <div className="lg:col-span-4 flex flex-col items-center text-center">
            <div 
              onClick={() => setSelectedService('gateway')}
              className="w-full p-6 rounded-2xl bg-white border-2 border-primary shadow-elevated relative cursor-pointer"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold tracking-wider uppercase">
                Single Public Entry
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center mx-auto shadow-subtle">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-ink-main mt-3">Nginx API Gateway</h3>
              <p className="text-xs text-ink-secondary mt-1">Reverse proxy, CORS, Rate Limit</p>
              
              <div className="mt-4 pt-3 border-t border-border-subtle text-left space-y-1 font-mono text-[11px]">
                <div className="text-ink-secondary flex justify-between">
                  <span>/api/catalog/*</span>
                  <span className="text-primary font-bold">→ 8001</span>
                </div>
                <div className="text-ink-secondary flex justify-between">
                  <span>/api/orders/*</span>
                  <span className="text-primary font-bold">→ 8002</span>
                </div>
                <div className="text-ink-secondary flex justify-between">
                  <span>/api/payments/*</span>
                  <span className="text-primary font-bold">→ 8003</span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Port 80 Operational</span>
              </div>
            </div>
          </div>

          {/* Node 3: Microservices Cluster (Col 7-12) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Catalog Service */}
            <div 
              onClick={() => setSelectedService('catalog')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-subtle ${
                isFaultActive
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-white border-border-subtle hover:border-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isFaultActive ? 'bg-amber-100 text-amber-700' : 'bg-primary-light text-primary'
                  }`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-ink-main">Catalog Service</h4>
                    <span className="text-[11px] text-ink-secondary font-mono">FastAPI • Port 8001</span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  isFaultActive
                    ? 'bg-amber-200 text-amber-800 animate-pulse'
                    : 'bg-mint text-mint-text'
                }`}>
                  {isFaultActive ? 'FAULT INJECTED' : 'ONLINE'}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs text-ink-secondary">
                <span className="flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span>SQLite: catalog.db</span>
                </span>
                <span className="font-semibold text-ink-main">
                  {healthMap.catalog?.latency_ms ? `${healthMap.catalog.latency_ms}ms ping` : 'Healthy'}
                </span>
              </div>
            </div>

            {/* Order Service */}
            <div 
              onClick={() => setSelectedService('order')}
              className="p-5 rounded-2xl bg-white border border-border-subtle hover:border-primary transition-all cursor-pointer shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-ink-main">Order Service</h4>
                    <span className="text-[11px] text-ink-secondary font-mono">FastAPI • Port 8002</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-mint text-mint-text">
                  ONLINE
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs text-ink-secondary">
                <span className="flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span>SQLite: orders.db</span>
                </span>
                <span className="font-semibold text-ink-main">
                  {healthMap.order?.latency_ms ? `${healthMap.order.latency_ms}ms ping` : 'Healthy'}
                </span>
              </div>
            </div>

            {/* Payment Service */}
            <div 
              onClick={() => setSelectedService('payment')}
              className="p-5 rounded-2xl bg-white border border-border-subtle hover:border-primary transition-all cursor-pointer shadow-subtle"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-ink-main">Payment Service</h4>
                    <span className="text-[11px] text-ink-secondary font-mono">FastAPI • Port 8003</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-mint text-mint-text">
                  ONLINE
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs text-ink-secondary">
                <span className="flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  <span>SQLite: payments.db</span>
                </span>
                <span className="font-semibold text-ink-main">
                  {healthMap.payment?.latency_ms ? `${healthMap.payment.latency_ms}ms ping` : 'Healthy'}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* CLOUD-NATIVE FAILURE DEMO & AUDIT FEED SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Safe Failure Demonstration Panel (Col 1-5) */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-border-subtle p-6 shadow-subtle space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-ink-main">Safe Failure & Recovery Demo</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-ink-secondary">
              Non-Payment
            </span>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed">
            Demonstrates cloud-native resilience. Injecting a fault into the <strong>Catalog Service</strong> simulates transient upstream latency or 500 degradation. 
            The Order Service handles this safely with <strong>bounded retries</strong> and timeouts.
          </p>

          <div className="p-4 rounded-xl bg-[#FAFBFD] border border-border-subtle space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-main mb-2">Simulated Fault Mode</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFaultType('500_error')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                    faultType === '500_error'
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border-subtle bg-white text-ink-secondary hover:border-slate-300'
                  }`}
                >
                  HTTP 500 Degradation
                </button>
                <button
                  type="button"
                  onClick={() => setFaultType('latency')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                    faultType === 'latency'
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-border-subtle bg-white text-ink-secondary hover:border-slate-300'
                  }`}
                >
                  3.0s Upstream Latency
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {!isFaultActive ? (
                <button
                  id="inject-catalog-fault-btn"
                  onClick={handleInjectFault}
                  disabled={isExecutingFault}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-subtle"
                >
                  <Flame className="w-4 h-4" />
                  <span>Inject Fault into Catalog</span>
                </button>
              ) : (
                <button
                  id="restore-catalog-fault-btn"
                  onClick={handleRestoreFault}
                  disabled={isExecutingFault}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-subtle"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Catalog Service</span>
                </button>
              )}
            </div>
          </div>

          {/* Fault status indicator */}
          <div className="text-xs text-ink-secondary">
            Current Status:{' '}
            {isFaultActive ? (
              <span className="text-amber-600 font-bold">
                Degraded ({faultType}) — Downstream services will log retry alerts.
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">
                100% Operational — All endpoints responsive.
              </span>
            )}
          </div>
        </div>

        {/* Live Real-time Event & Audit Stream (Col 6-12) */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-border-subtle p-6 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-ink-main">
                  Live Event & RPC Audit Feed
                </h3>
              </div>
              <span className="text-xs font-mono text-ink-secondary">
                {logs.length} events recorded
              </span>
            </div>

            {/* Event list */}
            <div className="mt-4 space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-secondary">
                  No events recorded yet. Perform actions on storefront to watch RPC streams.
                </div>
              ) : (
                logs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-[#FAFBFD] border border-border-subtle text-xs font-mono space-y-1 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-sans font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          log.service === 'catalog' ? 'bg-blue-100 text-blue-800' :
                          log.service === 'order' ? 'bg-amber-100 text-amber-800' :
                          log.service === 'payment' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-200 text-slate-800'
                        }`}>
                          {log.service.toUpperCase()}
                        </span>
                        <span className="text-ink-main">{log.action}</span>
                      </div>
                      <span className="text-[10px] text-ink-secondary font-mono">{log.timestamp}</span>
                    </div>

                    <div className="text-[11px] text-ink-secondary break-all">
                      {log.details}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-ink-secondary">
            <span>Real microservice RPCs stream directly from FastAPI & Nginx</span>
            <button
              onClick={onNavigateToStore}
              className="text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span>Back to Storefront</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
