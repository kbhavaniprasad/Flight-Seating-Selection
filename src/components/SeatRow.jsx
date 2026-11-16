import { memo } from 'react';
import { Seat } from './Seat';

export const SeatRow = memo(function SeatRow({
  row,
  seats, // array of seat columns for this row (may include aisle markers)
  state,
  seatToPassenger,
  bookedSeatIds = [],
  activePassengerId,
  onSeatClick,
  onSeatMouseEnter,
  onSeatMouseLeave,
}) {
  const activeAssignment = state.assignments[activePassengerId];

  return (
    <div className="flex items-center gap-1 px-2 min-h-[44px]">
      <span className="w-10 text-right text-xs font-medium text-gray-500 select-none">
        {row}
      </span>
      {seats.map((entry, index) => {
        if (entry.type === 'aisle') {
          return (
            <div key={`aisle-${index}`} className="aisle w-6 bg-transparent" />
          );
        }

        const seatId = `${row}${entry.letter}`;
        const seat = { ...entry, id: seatId, row };
        const occupied = seat.occupied || bookedSeatIds.includes(seatId);
        const holderId = seatToPassenger[seatId];
        const isSelectedByActive = activeAssignment === seatId;
        const isSelectedByOther = Boolean(holderId && holderId !== activePassengerId);

        return (
          <Seat
            key={seatId}
            seat={seat}
            isSelectedByActive={isSelectedByActive}
            isSelectedByOther={isSelectedByOther}
            isOccupied={occupied}
            isBooked={occupied}
            onClick={(e) => {
              onSeatClick(seatId);
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onSeatMouseEnter(seatId, rect.left + rect.width / 2, rect.top);
            }}
            onMouseLeave={(e) => {
              onSeatMouseLeave();
            }}
          />
        );
      })}
    </div>
  );
});

SeatRow.displayName = 'SeatRow';
