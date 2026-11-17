import { formatPrice } from '../data/seatLayouts';

export function BookingSuccessPage({
  booking,
  onStartOver,
}) {
  const lineItemsByPassenger = new Map(
    booking.lineItems?.map((item) => [item.passengerId, item]) || []
  );

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
                  { id: 'payment', label: '4. Payment', completed: true },
                  { id: 'success', label: '5. Booking Successful', completed: true, active: true },
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
                      {step.completed ? '✓' : step.active ? '5' : index + 1}
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
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Booking successful ✓
          </h1>
          <p className="text-sm text-gray-500">
            Your seats are confirmed. Booking reference {booking.transactionId?.slice(-8) || ''}.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-green-600">✓</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Your seats are confirmed
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Booking reference:{' '}
              <span className="font-mono text-sm font-medium text-gray-900">
                {booking.transactionId || '—'}
              </span>
            </p>

            <table className="w-full text-left border-collapse mb-6">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Passenger</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Seat</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Meal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Meal price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {booking.passengers.map((passenger) => {
                  const item = lineItemsByPassenger.get(passenger.passengerId || passenger.id);
                  return (
                    <tr key={passenger.passengerId || passenger.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {passenger.passengerName || passenger.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {item?.seatId || passenger.seatId || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {item?.category || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {item?.seatPrice !== undefined ? formatPrice(item.seatPrice) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {item?.meal || 'No Meal'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">
                        {item?.mealPrice ? formatPrice(item.mealPrice) : 'Free'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <th colSpan="5" scope="row" className="px-4 py-4 text-right text-sm font-bold">
                    Total paid
                  </th>
                  <td className="px-4 py-4 text-sm font-bold text-gray-900 text-right">
                    {formatPrice(booking.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <p className="text-xs text-gray-400">
              Your seats have been updated in the database and are now reserved for your journey.
            </p>
          </div>
          <div className="px-5 py-5 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={onStartOver}
              className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              Start a new booking
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

BookingSuccessPage.displayName = 'BookingSuccessPage';
