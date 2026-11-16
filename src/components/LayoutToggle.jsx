import { useContext } from 'react';
import { LAYOUTS, DEFAULT_LAYOUT_ID } from '../data/seatLayouts';
import { BookingContext } from '../context/BookingContext';

export function LayoutToggle({ onLayoutChange }) {
  const { layoutId, dispatch } = useContext(BookingContext);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-700">Layout:</span>
      <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            type="button"
            onClick={() =>
              onLayoutChange
                ? onLayoutChange(layout.id)
                : dispatch({ type: 'SET_LAYOUT', payload: { layoutId: layout.id } })
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              layoutId === layout.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="font-mono text-xs">{layout.label}</span>
          </button>
        ))}
      </div>
      <span className="ml-2 text-xs text-gray-500 italic">
        Switching layouts requires reselecting seats
      </span>
    </div>
  );
}
