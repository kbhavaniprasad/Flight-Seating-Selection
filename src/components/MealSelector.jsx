import { memo, useCallback } from 'react';
import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';
import { MEALS, DEFAULT_MEAL_ID } from '../data/meals';
import { formatPrice } from '../data/seatLayouts';

export const MealSelector = memo(function MealSelector({ passengerId, isActive, onSelect }) {
  const { meals, dispatch } = useContext(BookingContext);
  const currentMealId = meals[passengerId] || DEFAULT_MEAL_ID;

  const handleMealChange = useCallback(
    (mealId) => {
      dispatch({ type: 'SET_MEAL', payload: { passengerId, mealId } });
      if (onSelect) onSelect(passengerId);
    },
    [passengerId, dispatch, onSelect]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Meal selection
        </span>
        <span className="text-xs text-gray-400">One meal per passenger</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {MEALS.map((meal) => {
          const selected = currentMealId === meal.id;
          const paid = meal.price > 0;
          const isFree = meal.price === 0 && meal.id !== 'none';

          return (
            <button
              key={meal.id}
              type="button"
              onClick={() => handleMealChange(meal.id)}
              aria-checked={selected}
              className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border transition-all ${
                selected
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  selected ? 'text-blue-600' : paid ? 'text-amber-600' : 'text-green-600'
                }`}
              >
                {selected ? '✓ ' : ''}{meal.label}
              </span>
              <span className={`text-xs font-medium ${
                selected ? 'text-blue-600' : paid ? 'text-amber-700' : 'text-green-700'
              }`}>
                {meal.id === 'none' ? 'No meal' : paid ? `+${formatPrice(meal.price)}` : 'Free'}
              </span>
              {selected && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

MealSelector.displayName = 'MealSelector';
