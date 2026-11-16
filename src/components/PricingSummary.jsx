import { memo, useCallback } from 'react';
import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';
import { formatPrice } from '../data/seatLayouts';

export const PricingSummary = memo(function PricingSummary({ onConfirm }) {
  const {
    passengers,
    assignments,
    meals,
    pricing,
    dispatch,
  } = useContext(BookingContext);

  const hasAnySelection =
    Object.keys(assignments).length > 0 ||
    Object.values(meals).some((mealId) => mealId && mealId !== 'none');
  const seatCount = Object.keys(assignments).length;
  const allPassengersHaveSeats = passengers.every((p) => Boolean(assignments[p.id]));

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
      seat: item?.seatId || '—',
      category: item?.category || '—',
      seatPrice: item?.seatPrice || 0,
      meal: item?.meal || 'None',
      mealPrice: item?.mealPrice || 0,
      subtotal: item?.subtotal || 0,
      hasSeat,
    };
  });

  return (
    <section className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            Booking summary
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
                  Seat price
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Meal
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Meal price
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Subtotal
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
                    {r.passenger}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {r.seat}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {r.seatPrice === 0 ? '₹0' : formatPrice(r.seatPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {r.meal}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">
                    {r.mealPrice === 0 ? '₹0' : formatPrice(r.mealPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                    {formatPrice(r.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!hasAnySelection && (
          <div className="px-5 py-6 text-center text-gray-400 text-sm">
            No seats or meals selected yet.
          </div>
        )}

        {!allPassengersHaveSeats && hasAnySelection && (
          <div className="px-5 py-3 border-b border-gray-100 bg-amber-50">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-xs">⚠</span>
              <span className="text-sm text-amber-800">
                Not all passengers have a seat assigned. Please complete seat selection before
                confirming.
              </span>
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Grand total</span>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(pricing.grandTotal)}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Includes seat and meal charges. Prices in INR (₹).
          </p>
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <ConfirmSeatsButton
            seatCount={seatCount}
            total={pricing.grandTotal}
            onClick={onConfirm}
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
