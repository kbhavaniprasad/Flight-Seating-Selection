import { formatPrice } from '../data/seatLayouts';

export function BookingConfirmation({
  mode,
  passengers,
  assignments,
  pricing,
  onEdit,
  onConfirm,
  onStartOver,
  isSubmitting = false,
}) {
  const missingSeatCount = passengers.filter(
    (passenger) => !assignments[passenger.id]
  ).length;
  const lineItemsByPassenger = new Map(
    pricing.lineItems.map((item) => [item.passengerId, item])
  );
  const isSuccess = mode === 'success';
  const allHaveMeals = passengers.every(
    (p) => Boolean(pricing.lineItems.find((i) => i.passengerId === p.id)?.mealId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-confirmation-title"
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-7">
          <div>
            <h2 id="booking-confirmation-title" className="text-xl font-bold text-gray-900">
              {isSuccess ? 'Booking confirmed!' : 'Review your booking'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isSuccess
                ? 'Your seat and meal selections are confirmed.'
                : 'Check the itemized details before confirming your booking.'}
            </p>
          </div>
          {!isSuccess && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded px-2 py-1 text-xl leading-none text-gray-500 hover:bg-gray-100"
              aria-label="Close review and edit selection"
            >
              ×
            </button>
          )}
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-7">
          {!isSuccess && missingSeatCount > 0 && (
            <div
              className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
              role="alert"
            >
              <strong>
                {missingSeatCount} passenger{missingSeatCount === 1 ? ' has' : 's have'} no seat
                assigned.
              </strong>{' '}
              Please return to the seat map to assign seats before confirming.
            </div>
          )}

          {isSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
              Booking complete. Your selection summary is below.
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Passenger',
                    'Seat',
                    'Category',
                    'Seat price',
                    'Meal',
                    'Meal price',
                    'Subtotal',
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {passengers.map((passenger) => {
                  const item = lineItemsByPassenger.get(passenger.id);
                  const seatPrice = item ? item.seatPrice : 0;
                  const mealPrice = item ? item.mealPrice : 0;
                  return (
                    <tr key={passenger.id}>
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">
                        {passenger.name}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {item && item.seatId ? item.seatId : '—'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {item && item.category ? item.category : '—'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700 text-right">
                        {formatPrice(seatPrice)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {item ? item.meal : 'None'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700 text-right">
                        {formatPrice(mealPrice)}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatPrice(item ? item.subtotal : 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <th colSpan="6" scope="row" className="px-3 py-4 text-right text-sm font-bold">
                    Grand total
                  </th>
                  <td className="px-3 py-4 text-sm font-bold text-gray-900 text-right">
                    {formatPrice(pricing.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {isSuccess ? (
              <button
                type="button"
                onClick={onStartOver}
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Start over
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit selection
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isSubmitting || missingSeatCount > 0}
                  aria-busy={isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70 disabled:bg-gray-300 transition-colors"
                >
                  {isSubmitting
                    ? 'Confirming booking…'
                    : missingSeatCount > 0
                      ? 'Incomplete selection'
                      : 'Confirm booking'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
