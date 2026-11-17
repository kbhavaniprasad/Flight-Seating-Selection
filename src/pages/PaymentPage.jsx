import { useState } from 'react';
import { formatPrice } from '../data/seatLayouts';
import { apiUrl } from '../config/api';

/**
 * Payment page with a development-only mock payment integration.
 *
 * The development build uses a clearly labeled mock endpoint. Production
 * requires a real provider; the backend rejects payments until one is wired.
 */
export function PaymentPage({
  booking,
  onPaymentSuccess,
  onPaymentFailure,
  onCancel,
  isProcessing = false,
}) {
  const [error, setError] = useState(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentRequestPending, setPaymentRequestPending] = useState(false);

  const handlePay = async () => {
    if (paymentRequestPending || isProcessing) return;
    setError(null);
    setPaymentRequestPending(true);
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    try {
      const response = await fetch(apiUrl('/api/payments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: booking.grandTotal,
          transactionId,
          paymentMethod: 'card',
          simulateFailure,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Payment service returned HTTP ${response.status}.`);
      }

      // Verified successful payment response from the backend.
      onPaymentSuccess({ ...booking, transactionId, payment: result });
    } catch (paymentError) {
      setError(paymentError.message || 'Payment failed. Please try again.');
    } finally {
      setPaymentRequestPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress indicator */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Booking progress
              </p>
            </div>
            <div className="flex-1 max-w-md mx-auto">
              <div className="flex items-center gap-1">
                {[
                  { id: 'passengers', label: '1. Select Passengers', completed: true },
                  { id: 'seats', label: '2. Choose Seats', completed: true },
                  { id: 'confirmation', label: '3. Booking Confirmation', completed: true },
                  { id: 'payment', label: '4. Payment', completed: false, active: true },
                  { id: 'success', label: '5. Booking Successful', completed: false },
                ].map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        step.active
                          ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                          : step.completed
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {step.completed ? '✓' : step.active ? '4' : index + 1}
                    </div>
                    <span
                      className={`text-[10px] font-medium leading-tight text-center ${
                        step.active
                          ? 'text-blue-600'
                          : step.completed
                            ? 'text-gray-600'
                            : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < 4 && (
                      <div
                        className={`w-10 h-px ${
                          step.completed || step.active ? 'bg-blue-300' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Booking Confirmation
          </button>
          <div className="mt-3">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Payment</h1>
            <p className="text-sm text-gray-500">
              Securely complete your payment of {formatPrice(booking.grandTotal)}.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-6" role="alert">
            {error}
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-3 text-xs font-medium text-red-600 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Payment form */}
          <section className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Payment details
                </h2>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Card number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Dev mode: any card number is accepted.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Expiry date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength="5"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      maxLength="3"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Name on card
                  </label>
                  <input
                    type="text"
                    placeholder="Aryan Sharma"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                Amount to pay
              </h2>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(booking.grandTotal)}
                </span>
                <span className="text-sm text-gray-500">payable now</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {import.meta.env.DEV
                  ? 'Development mock only. No real money is charged.'
                  : 'Online payment is unavailable until a production payment provider is configured.'}
              </p>
            </div>
          </section>

          {/* Right: Order summary + payment action */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Order summary
                </h2>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-3">
                  <span className="text-gray-500">Seat total</span>
                  <span className="font-medium text-gray-900 text-right">
                    {formatPrice(booking.seatTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-3">
                  <span className="text-gray-500">Meal total</span>
                  <span className="font-medium text-gray-900 text-right">
                    {formatPrice(booking.mealTotal || 0)}
                  </span>
                </div>
                {booking.taxAmount > 0 && (
                  <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-3">
                    <span className="text-gray-500">Taxes &amp; charges</span>
                    <span className="font-medium text-gray-900 text-right">
                      +{formatPrice(booking.taxAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold pt-3">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600 text-right">{formatPrice(booking.grandTotal)}</span>
                </div>
              </div>
              <div className="px-5 py-5 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing}
                  aria-busy={isProcessing}
                  className={`w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                    isProcessing
                      ? 'bg-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg'
                  }`}
                >
                  {isProcessing ? 'Processing payment…' : 'Pay now'}
                </button>
              </div>
            </div>

            {/* Dev-only failure simulation — clearly identified, not part of production flow */}
            {import.meta.env.DEV && <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Developer options
              </h3>
              {import.meta.env.DEV && <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700 cursor-pointer">
                  Simulate payment failure
                </label>
              </div>}
              {import.meta.env.DEV && <p className="text-xs text-gray-400 mt-2">
                Toggle to test the payment-failure and retry path. This option only exists in
                development mode.
              </p>}
            </div>}
          </aside>
        </div>
      </main>
    </div>
  );
}

PaymentPage.displayName = 'PaymentPage';
