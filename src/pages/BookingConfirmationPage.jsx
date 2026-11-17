import { useState } from 'react';
import { formatPrice } from '../data/seatLayouts';

/**
 * Default journey information. In a production integration this would be
 * supplied by the booking service (flight number, route, travel date, etc.).
 */
export const DEFAULT_JOURNEY = {
  serviceName: 'Express Flight Service',
  serviceNumber: 'FS-2401',
  route: 'Delhi (DEL) → Mumbai (BOM)',
  travelDate: new Date().toISOString().split('T')[0],
  departureTime: '06:45',
  arrivalTime: '09:15',
  duration: '2h 30m',
  aircraft: 'Airbus A320',
};

export function BookingConfirmationPage({
  journey = DEFAULT_JOURNEY,
  passengers,
  assignments,
  pricing,
  layoutId,
  onBack,
  onProceedToPayment,
  isProcessing = false,
}) {
  const [error, setError] = useState(null);

  const lineItemsByPassenger = new Map(
    pricing.lineItems.map((item) => [item.passengerId, item])
  );

  const seatTotal = pricing.seatTotal;
  const mealTotal = pricing.mealTotal || 0;
  // Tax configuration: adjust as required. 0% by default; set a rate to charge tax.
  const taxRate = 0;
  const taxAmount = Math.round(((seatTotal + mealTotal) * taxRate) / 100);
  const grandTotal = seatTotal + mealTotal + taxAmount;

  const handleProceed = () => {
    setError(null);
    // Final validation before payment.
    const missing = passengers.filter((p) => !assignments[p.id]);
    if (missing.length > 0) {
      setError(
        `Please assign a seat to all passengers before proceeding to payment (${missing.length} remaining).`
      );
      return;
    }
    if (grandTotal <= 0) {
      setError('The booking amount is invalid.');
      return;
    }
    onProceedToPayment({
      passengers,
      assignments,
      layoutId,
      seatTotal,
      mealTotal,
      taxAmount,
      grandTotal,
      lineItems: pricing.lineItems,
      journey,
    });
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
                  { id: 'confirmation', label: '3. Booking Confirmation', completed: false, active: true },
                  { id: 'payment', label: '4. Payment', completed: false },
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
                      {step.completed ? '✓' : step.active ? '3' : index + 1}
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
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Seat Selection
          </button>
          <div className="mt-3">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Review your booking
            </h1>
            <p className="text-sm text-gray-500">
              Check the journey, passenger and payment details before paying.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-6" role="alert">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Journey & Passenger details */}
          <section className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Journey information
                </h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium text-gray-900">
                    {journey.serviceName} ({journey.serviceNumber})
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Route</span>
                  <span className="font-medium text-gray-900">{journey.route}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Travel date</span>
                  <span className="font-medium text-gray-900">{journey.travelDate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Departure → Arrival</span>
                  <span className="font-medium text-gray-900">
                    {journey.departureTime} → {journey.arrivalTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Aircraft</span>
                  <span className="font-medium text-gray-900">{journey.aircraft}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Passenger information
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {passengers.map((passenger) => {
                  const item = lineItemsByPassenger.get(passenger.id);
                  const seatId = item?.seatId;
                  const category = item?.category;
                  return (
                    <div key={passenger.id} className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-600"
                          >
                            {passenger.id.replace('p', '')}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {passenger.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Passenger {passenger.id.replace('p', '')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {seatId ? (
                            <>
                              <p className="text-sm font-semibold text-blue-600">{seatId}</p>
                              <p className="text-xs text-gray-500">
                                {category || '—'}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-red-600">No seat</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                        <span className="text-gray-500">Meal · {item?.meal || 'No Meal'}</span>
                        <span className="font-medium text-gray-700">
                          {item?.mealPrice ? formatPrice(item.mealPrice) : 'Free'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right: Payment summary */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Payment summary
                </h2>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-3">
                  <span className="text-gray-500">Seat total</span>
                  <span className="font-medium text-gray-900 text-right">{formatPrice(seatTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-3">
                  <span className="text-gray-500">Meal total</span>
                  <span className="font-medium text-gray-900 text-right">{formatPrice(mealTotal)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-3">
                    <span className="text-gray-500">Taxes &amp; charges</span>
                    <span className="font-medium text-gray-900 text-right">
                      +{formatPrice(taxAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold pt-3">
                  <span className="text-gray-900">Final payable amount</span>
                  <span className="text-blue-600 text-right">{formatPrice(grandTotal)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  Amount payable at the time of booking. Taxes are configurable and shown when
                  applicable.
                </p>
              </div>
              <div className="px-5 py-5 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={isProcessing || error}
                  aria-busy={isProcessing}
                  className={`w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                    isProcessing
                      ? 'bg-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg'
                  }`}
                >
                  {isProcessing ? 'Processing payment…' : 'Proceed to payment'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

BookingConfirmationPage.displayName = 'BookingConfirmationPage';
