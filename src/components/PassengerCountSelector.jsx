import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';

export function PassengerCountSelector() {
  const { passengerCount, dispatch } = useContext(BookingContext);

  const decrease = () =>
    dispatch({ type: 'SET_PASSENGER_COUNT', payload: { count: passengerCount - 1 } });
  const increase = () =>
    dispatch({ type: 'SET_PASSENGER_COUNT', payload: { count: passengerCount + 1 } });

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-gray-700">Passengers</span>
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg bg-white shadow-sm">
        <button
          type="button"
          onClick={decrease}
          disabled={passengerCount <= 1}
          aria-label="Decrease passenger count"
          className="w-10 h-10 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-medium text-gray-900">
          {passengerCount}
        </span>
        <button
          type="button"
          onClick={increase}
          disabled={passengerCount >= 9}
          aria-label="Increase passenger count"
          className="w-10 h-10 flex items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
      <span className="text-xs text-gray-500">(1–9)</span>
    </div>
  );
}
