import { memo, useCallback } from 'react';
import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';
import { formatPrice } from '../data/seatLayouts';

export const PricingSummary = memo(function PricingSummary({ onNext }) {
  const {
    passengers,
    assignments,
    pricing,
    dispatch,
  } = useContext(BookingContext);

  const seatCount = Object.keys(assignments).length;
  const requiredCount = passengers.length;
  const allPassengersHaveSeats = passengers.every((p) => Boolean(assignments[p.id]));
  const hasAnySelection = seatCount > 0;

  const lineItemsByPassenger = new Map(
    pricing.lineItems.map((item) => [item.passengerId, item])
  );

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, [dispatch]);

  const rows = passengers.map((p) => {
    const item = lineItemsByPassenger.get(p.id);
    const hasSeat = Boolean(item?.seatId);
    return {
      passengerId: p.id,
      passenger: p.name,
      passengerNumber: p.id.replace('p', ''),
      seat: item?.seatId || '—',
      category: item?.category || '—',
      seatPrice: item?.seatPrice || 0,
      meal: item?.meal || 'No Meal',
      mealPrice: item?.mealPrice || 0,
      subtotal: item?.subtotal || 0,
      hasSeat,
    };
  });

  return (
    <section className="space-y-4">
      {/* Seat selection progress counter */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            Seat selection
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Passenger
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Seat
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Seat price
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Meal
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Meal price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r) => (
                <tr
                  key={r.passengerId}
                  className={`hover:bg-gray-50 transition-colors ${
                    !r.hasSeat ? 'border-l-2 border-red-200 bg-red-50/30' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <span className="mr-2 text-xs font-semibold text-gray-400">
                      Passenger {r.passengerNumber}
                    </span>
                    {r.passenger}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {r.hasSeat ? (
                      <span className="font-semibold text-blue-600">{r.seat}</span>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {r.hasSeat ? (
                      <span className="font-medium text-gray-700">{r.category}</span>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    {r.seatPrice === 0 ? 'Complimentary' : formatPrice(r.seatPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{r.meal}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    {r.mealPrice === 0 ? 'Free' : formatPrice(r.mealPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!hasAnySelection && (
          <div className="px-5 py-6 text-center text-gray-400 text-sm">
            No seats selected yet. Choose seats on the seat map.
          </div>
        )}

        {!allPassengersHaveSeats && hasAnySelection && (
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-xs">⚠</span>
              <span className="text-sm text-amber-800">
                {seatCount} of {requiredCount} seat{requiredCount === 1 ? '' : 's'} selected. Please
                complete seat selection before continuing.
              </span>
            </div>
          </div>
        )}

        {allPassengersHaveSeats && hasAnySelection && (
          <div className="px-5 py-3 border-b border-gray-100 bg-green-50">
            <div className="flex items-start gap-2">
              <span className="text-green-600 text-xs">✓</span>
              <span className="text-sm text-green-800">
                All {requiredCount} seat{requiredCount === 1 ? '' : 's'} selected.
              </span>
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Seat charges</span>
            <span className="font-medium text-gray-900">{formatPrice(pricing.seatTotal)}</span>
          </div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600">Meal charges</span>
            <span className="font-medium text-gray-900">{formatPrice(pricing.mealTotal)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-sm font-semibold text-gray-700">Total payable</span>
            <span className="text-xl font-bold text-gray-900">{formatPrice(pricing.grandTotal)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">Seat and meal charges in INR (₹).</p>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <NextButton
            seatCount={seatCount}
            requiredCount={requiredCount}
            total={pricing.grandTotal}
            onClick={onNext}
            disabled={!allPassengersHaveSeats}
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Reset all selections
          </button>
        </div>
      </div>
    </section>
  );
});

function NextButton({ seatCount, requiredCount, total, onClick, disabled = false }) {
  const label =
    seatCount === 0
      ? `Select seats · ${formatPrice(total)}`
      : seatCount < requiredCount
        ? `${seatCount} of ${requiredCount} seats selected`
        : `Next: Review booking · ${formatPrice(total)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || seatCount === 0}
      aria-label={`Next: ${seatCount} of ${requiredCount} seats selected, total ${formatPrice(total)}`}
      className={`w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 shadow-md hover:shadow-lg`}
    >
      {disabled && seatCount > 0 ? `Complete seat selection (${seatCount} of ${requiredCount})` : label}
    </button>
  );
}

export function ConfirmSeatsButton({ seatCount, total, onClick, disabled = false, className = '' }) {
  const label =
    seatCount === 0
      ? `Confirm seats · ${formatPrice(total)}`
      : `Confirm ${seatCount} ${seatCount === 1 ? 'seat' : 'seats'} · ${formatPrice(total)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || seatCount === 0}
      aria-label={`Confirm seats: ${seatCount} selected, total ${formatPrice(total)}`}
      className={`w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 ${className}`}
    >
      {disabled && seatCount > 0 ? 'Complete seat selection first' : label}
    </button>
  );
}

PricingSummary.displayName = 'PricingSummary';
