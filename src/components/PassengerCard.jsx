import { memo, useState } from 'react';
import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';
import { formatPrice, getCategoryConfig } from '../data/seatLayouts';
import { MealSelector } from './MealSelector';

export const PassengerCard = memo(function PassengerCard({ passenger }) {
  const {
    dispatch,
    activePassengerId,
    assignments,
    meals,
    pricing,
  } = useContext(BookingContext);

  const seatId = assignments[passenger.id];
  const mealId = meals[passenger.id];
  const lineItem = pricing.lineItems.find((item) => item.passengerId === passenger.id);
  const seatPrice = lineItem ? lineItem.seatPrice : 0;
  const mealPrice = lineItem ? lineItem.mealPrice : 0;
  const isActive = activePassengerId === passenger.id;
  const subtotal = seatPrice + mealPrice;

  const config = seatId ? getCategoryConfig(lineItem?.category?.toLowerCase() || 'standard') : null;

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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {passenger.id.replace('p', '')}
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
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                    config ? config.badge : 'border-gray-200 text-gray-500'
                  }`}
                >
                  {seatId}
                  {config && <span className="text-[10px]">{config.label.charAt(0)}</span>}
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

      {/* Meal selector */}
      <MealSelector
        passengerId={passenger.id}
        isActive={isActive}
        onSelect={() => dispatch({ type: 'SET_ACTIVE_PASSENGER', payload: { passengerId: passenger.id } })}
      />

      {/* Subtotal */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Passenger total</span>
        <span className="text-sm font-bold text-gray-900">{formatPrice(subtotal)}</span>
      </div>

      {!isActive && seatId && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Select this passenger to modify their seat or meal.
        </p>
      )}
    </div>
  );
});

PassengerCard.displayName = 'PassengerCard';
