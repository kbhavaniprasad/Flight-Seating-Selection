import { memo, useState } from 'react';
import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';
import { formatPrice } from '../data/seatLayouts';
import { MealSelector } from './MealSelector';

/**
 * Compact passenger card shown in the right-side booking panel.
 *
 * Displays only passenger + seat information:
 *   - Passenger number (Passenger 1, Passenger 2, …)
 *   - Selected seat number
 *   - Seat category (Standard / Premium / Extra Large)
 *   - Individual seat price
 *
 * The meal selector has been removed from this panel per the redesign.
 */
export const PassengerCard = memo(function PassengerCard({ passenger }) {
  const {
    dispatch,
    activePassengerId,
    assignments,
    pricing,
  } = useContext(BookingContext);

  const seatId = assignments[passenger.id];
  const lineItem = pricing.lineItems.find((item) => item.passengerId === passenger.id);
  const seatPrice = lineItem ? lineItem.seatPrice : 0;
  const category = lineItem ? lineItem.category : null;
  const isActive = activePassengerId === passenger.id;
  const passengerNumber = passenger.id.replace('p', '');

  const [editName, setEditName] = useState(false);
  const [nameInput, setNameInput] = useState(passenger.name);

  const handleRemoveSeat = () => {
    dispatch({ type: 'REMOVE_SEAT', payload: { passengerId: passenger.id } });
  };

  const handleSaveName = () => {
    const name = nameInput.trim();
    if (name) {
      dispatch({ type: 'SET_PASSENGER_NAME', payload: { passengerId: passenger.id, name } });
    }
    setEditName(false);
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition-all duration-200 ${
        isActive
          ? 'border-blue-500 bg-blue-50 shadow-[0_0_12px_rgba(59,130,246,0.1)]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Header: passenger number + name */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {passengerNumber}
          </span>
          {editName ? (
            <input
              autoFocus
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
            />
          ) : (
            <span className="font-semibold text-gray-900 truncate max-w-xs">
              {passenger.name}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setNameInput(passenger.name);
              setEditName(true);
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="Edit name"
          >
            ✎
          </button>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_ACTIVE_PASSENGER', payload: { passengerId: passenger.id } })}
          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            isActive
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isActive ? 'Active' : 'Select'}
        </button>
      </div>

      {/* Seat info */}
      <div className="space-y-2 text-sm mb-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Seat</span>
          <div className="flex items-center gap-2">
            {seatId ? (
              <>
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
                    category === 'Standard'
                      ? 'border-green-200 text-green-700 bg-green-50'
                      : category === 'Premium'
                        ? 'border-amber-200 text-amber-800 bg-amber-50'
                        : category === 'Extra Large'
                          ? 'border-purple-200 text-purple-800 bg-purple-50'
                          : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {seatId}
                  {category && <span className="text-[10px]">{category.charAt(0)}</span>}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({ type: 'SET_ACTIVE_PASSENGER', payload: { passengerId: passenger.id } })
                  }
                  className="text-blue-600 hover:text-blue-800 text-xs underline hover:decoration-blue-200"
                  aria-label={`Change seat for ${passenger.name}`}
                >
                  Change seat
                </button>
                <button
                  type="button"
                  onClick={handleRemoveSeat}
                  className="text-red-600 hover:text-red-800 text-xs underline hover:decoration-red-200"
                  aria-label="Remove seat"
                >
                  Remove
                </button>
              </>
            ) : (
              <span className="text-gray-400 italic">No seat selected</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-gray-500 text-xs">Seat charge</span>
          <span className="font-medium text-gray-900 text-right">
            {seatPrice === 0 ? 'Complimentary' : formatPrice(seatPrice)}
          </span>
        </div>
      </div>

      {/* Subtotal (seat only) */}
      <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3">
        <MealSelector passengerId={passenger.id} />
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Passenger total</span>
        <span className="text-sm font-bold text-gray-900">{formatPrice(seatPrice + (lineItem?.mealPrice || 0))}</span>
      </div>

      {!isActive && seatId && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Select this passenger to modify their seat.
        </p>
      )}
    </div>
  );
});

PassengerCard.displayName = 'PassengerCard';
