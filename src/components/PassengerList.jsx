import { memo, useCallback } from 'react';
import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';
import { PassengerCard } from './PassengerCard';
import { MealSelector } from './MealSelector';

export const PassengerList = memo(function PassengerList() {
  const { passengers, activePassengerId, dispatch } = useContext(BookingContext);

  const handleSetActive = useCallback(
    (id) => dispatch({ type: 'SET_ACTIVE_PASSENGER', payload: { passengerId: id } }),
    [dispatch]
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Passengers
        </h3>
      </div>
      <div className="grid gap-3">
        {passengers.map((p) => (
          <div key={p.id}>
            <PassengerCard passenger={p} />
            <MealSelector
              passengerId={p.id}
              isActive={activePassengerId === p.id}
              onSelect={handleSetActive}
            />
          </div>
        ))}
      </div>
    </section>
  );
});

PassengerList.displayName = 'PassengerList';
