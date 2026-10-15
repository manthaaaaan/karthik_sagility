import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  Copy, 
  Check,
  RotateCcw
} from 'lucide-react';
import { CartItem, Order, Payment } from '../types';
import { createOrder, processPayment } from '../services/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderCompleted: (order: Order, payment: Payment) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderCompleted
}) => {
  if (!isOpen) return null;

  // Form State
  const [customerName, setCustomerName] = useState('Sarah Jenkins');
  const [customerEmail, setCustomerEmail] = useState('sarah.jenkins@designcorp.io');
  const [shippingAddress, setShippingAddress] = useState('500 Howard Street, Suite 400, San Francisco, CA 94105');
  
  // Payment Simulation Controls
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  
  // Processing & Orchestration State
  const [stage, setStage] = useState<'form' | 'orchestrating' | 'result'>('form');
  const [orchestrationStep, setOrchestrationStep] = useState<number>(0);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [processedPayment, setProcessedPayment] = useState<Payment | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.0825;
  const shipping = subtotal >= 100 ? 0 : 15;
  const grandTotal = subtotal + tax + shipping;

  const handleStartCheckout = async () => {
    setStage('orchestrating');
    setErrorMessage(null);
    setOrchestrationStep(1);

    try {
      // Step 1: Create Order in Order Service (status PENDING)
      await new Promise(r => setTimeout(r, 600));
      setOrchestrationStep(2); // Order Service fetching Catalog prices

      const orderPayload = {
        customer_name: customerName,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      const order = await createOrder(orderPayload);
      setCreatedOrder(order);

      // Step 2: Payment Service processing
      setOrchestrationStep(3); // Contacting Payment Service with Idempotency Key
      await new Promise(r => setTimeout(r, 700));

      const payment = await processPayment({
        order_id: order.id,
        amount: order.total_amount,
        idempotency_key: idempotencyKey,
        simulate_failure: simulateFailure,
        payment_method: simulateFailure ? 'Mock Visa •••• 0000 (Simulated Decline)' : 'Mock Visa •••• 4242'
      });
      setProcessedPayment(payment);

      // Step 3: Order Status Synchronization
      setOrchestrationStep(4);
      await new Promise(r => setTimeout(r, 500));

      // Done
      order.status = payment.status === 'SUCCESS' ? 'CONFIRMED' : 'PAYMENT_FAILED';
      order.payment_id = payment.id;
      setCreatedOrder({ ...order });

      onOrderCompleted(order, payment);
      setStage('result');
    } catch (err: any) {
      setErrorMessage(err.message || 'Orchestration failed');
      setStage('form');
    }
  };

  // Duplicate replay test to verify idempotency in action
  const handleTestIdempotencyReplay = async () => {
    if (!createdOrder || !processedPayment) return;
    setStage('orchestrating');
    setOrchestrationStep(3);

    try {
      await new Promise(r => setTimeout(r, 400));
      const replayedPayment = await processPayment({
        order_id: createdOrder.id,
        amount: createdOrder.total_amount,
        idempotency_key: idempotencyKey, // Replaying identical key!
        simulate_failure: false,
        payment_method: 'Mock Visa •••• 4242'
      });
      setProcessedPayment(replayedPayment);
      setStage('result');
    } catch (err: any) {
      setErrorMessage(err.message);
      setStage('result');
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(idempotencyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const resetForNewTest = () => {
    setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    setStage('form');
    setCreatedOrder(null);
    setProcessedPayment(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-main/50 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-floating border border-border-subtle overflow-hidden my-8 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-[#FAFBFD]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Multi-Service Checkout
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-ink-secondary font-mono">
                Safe Mock Mode
              </span>
            </div>
            <h2 className="text-xl font-bold text-ink-main mt-0.5">
              Secure Order Orchestration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-ink-secondary hover:text-ink-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Stage */}
        {stage === 'form' && (
          <div className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-ink-main flex items-center gap-2">
                <span>1. Shipping Information</span>
                <span className="text-xs font-normal text-ink-secondary">(Pre-filled for fast evaluation)</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-canvas text-ink-main text-xs font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">Email Address</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-canvas text-ink-main text-xs font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-canvas text-ink-main text-xs font-medium focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Payment & Cloud Native Simulation Controls */}
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h3 className="text-sm font-bold text-ink-main">
                2. Payment Service & Idempotency Controls
              </h3>

              {/* Idempotency Key display */}
              <div className="p-3 rounded-xl bg-slate-50 border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-ink-secondary">Idempotency Key (UUID/Digest)</div>
                  <div className="text-xs font-mono font-bold text-ink-main">{idempotencyKey}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyKey}
                    title="Copy Key"
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-ink-secondary transition-colors"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`)}
                    title="Generate New Key"
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-ink-secondary transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Simulated Failure Toggle */}
              <div className="p-4 rounded-xl border border-border-subtle bg-white hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-ink-main">Simulate Payment Failure State</div>
                    <div className="text-[11px] text-ink-secondary mt-0.5">
                      Triggers upstream decline (Code 05) to demonstrate order transition to <code>PAYMENT_FAILED</code>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={e => setSimulateFailure(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              </div>

              {/* Mock Card Preview */}
              <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-ink-main">
                    {simulateFailure ? 'Mock Visa •••• 0000 (Fail)' : 'Mock Visa •••• 4242'}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold bg-mint px-2 py-0.5 rounded-full">
                  Zero Real Data Collected
                </span>
              </div>
            </div>

            {/* Order Summary Line */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-ink-secondary">Grand Total Due</span>
                <div className="text-xl font-extrabold text-ink-main">${grandTotal.toFixed(2)}</div>
              </div>
              <button
                id="submit-order-orchestration"
                onClick={handleStartCheckout}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-subtle"
              >
                <span>Authorize & Place Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* Orchestrating Stage (Live Step Animation) */}
        {stage === 'orchestrating' && (
          <div className="p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-ink-main">
                Orchestrating Cloud-Native Transaction
              </h3>
              <p className="text-xs text-ink-secondary mt-1 max-w-sm mx-auto">
                Executing distributed microservices protocol through Nginx Gateway
              </p>
            </div>

            {/* Microservice Step Progress */}
            <div className="max-w-md mx-auto space-y-3 text-left">
              
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                orchestrationStep >= 1 ? 'border-primary bg-primary-light text-primary font-bold' : 'border-border-subtle text-ink-secondary'
              }`}>
                <div className="flex items-center gap-2.5">
                  {orchestrationStep > 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <span>1. Order Service (8002): Initializing order record (PENDING)</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                orchestrationStep >= 2 ? 'border-primary bg-primary-light text-primary font-bold' : 'border-border-subtle text-ink-secondary'
              }`}>
                <div className="flex items-center gap-2.5">
                  {orchestrationStep > 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : orchestrationStep === 2 ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <span className="w-4 h-4 rounded-full border border-slate-300" />}
                  <span>2. Catalog Service (8001): Price verification via bounded retry</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                orchestrationStep >= 3 ? 'border-primary bg-primary-light text-primary font-bold' : 'border-border-subtle text-ink-secondary'
              }`}>
                <div className="flex items-center gap-2.5">
                  {orchestrationStep > 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : orchestrationStep === 3 ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <span className="w-4 h-4 rounded-full border border-slate-300" />}
                  <span>3. Payment Service (8003): Idempotency check & charge</span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                orchestrationStep >= 4 ? 'border-primary bg-primary-light text-primary font-bold' : 'border-border-subtle text-ink-secondary'
              }`}>
                <div className="flex items-center gap-2.5">
                  {orchestrationStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="w-4 h-4 rounded-full border border-slate-300" />}
                  <span>4. Synchronizing final order state: CONFIRMED / PAYMENT_FAILED</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Result Stage */}
        {stage === 'result' && createdOrder && processedPayment && (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Status Banner */}
            <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
              processedPayment.status === 'SUCCESS'
                ? 'bg-mint/40 border-mint text-mint-text'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {processedPayment.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">
                    {processedPayment.status === 'SUCCESS'
                      ? 'Payment & Order Confirmed'
                      : 'Payment Failed (Simulated Decline)'}
                  </h3>
                  {processedPayment.is_idempotent_replay && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-lavender text-lavender-text border border-lavender-text/30">
                      IDEMPOTENT CACHE HIT
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1 leading-relaxed">
                  {processedPayment.status === 'SUCCESS'
                    ? `Order ${createdOrder.id} has been transitioned to status CONFIRMED in orders.db.`
                    : `Order ${createdOrder.id} transitioned to PAYMENT_FAILED. Reason: ${processedPayment.failure_reason}`}
                </p>
              </div>
            </div>

            {/* Transaction Data Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-border-subtle space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-border-subtle font-sans">
                <span className="text-ink-secondary">Order ID</span>
                <span className="font-bold text-ink-main">{createdOrder.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle font-sans">
                <span className="text-ink-secondary">Payment ID</span>
                <span className="font-bold text-ink-main">{processedPayment.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle font-sans">
                <span className="text-ink-secondary">Amount Processed</span>
                <span className="font-bold text-ink-main">${processedPayment.amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle font-sans">
                <span className="text-ink-secondary">Idempotency Key</span>
                <span className="font-bold text-primary truncate max-w-[220px]">{processedPayment.idempotency_key}</span>
              </div>
              <div className="flex justify-between py-1 font-sans">
                <span className="text-ink-secondary">Idempotent Replay?</span>
                <span className={`font-bold ${processedPayment.is_idempotent_replay ? 'text-purple-600' : 'text-slate-600'}`}>
                  {processedPayment.is_idempotent_replay ? 'YES (No Duplicate Charge)' : 'NO (Fresh Transaction)'}
                </span>
              </div>
            </div>

            {/* Test Idempotency Button */}
            <div className="p-4 rounded-xl bg-lavender/30 border border-lavender flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-lavender-text">Verify Idempotency Live</div>
                <div className="text-[11px] text-ink-secondary mt-0.5">
                  Re-submit with exact same key to observe HTTP X-Cache-Lookup: HIT
                </div>
              </div>
              <button
                id="test-idempotency-replay-btn"
                onClick={handleTestIdempotencyReplay}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-lavender text-lavender-text text-xs font-bold hover:bg-lavender/50 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-send Same Key</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={resetForNewTest}
                className="text-xs font-bold text-primary hover:underline"
              >
                ← Test Another Checkout
              </button>
              <button
                id="close-checkout-view-orders"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-ink-main text-white text-xs font-bold hover:bg-ink-main/90 transition-colors shadow-subtle"
              >
                View in Order History
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
