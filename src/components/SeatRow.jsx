import { memo } from 'react';
import { Seat } from './Seat';

/**
 * Compute the real-time status of a single seat from the actual seat data.
 *
 * Statuses:
 *   - available   : free to select
 *   - occupied    : pre-occupied by the airline (hard block)
 *   - booked      : confirmed in the database by another user (hard block)
 *   - selected    : selected by the active passenger
 *   - taken       : held by another passenger in this session
 *   - reserved    : temporarily reserved (treated like booked for selection)
 */
function computeSeatStatus({
  seat,
  bookedSeatIds,
  seatToPassenger,
  activePassengerId,
  activeAssignment,
}) {
  const seatId = `${seat.row}${seat.letter}`;
  if (seat.occupied) return 'occupied';
  if (bookedSeatIds.includes(seatId)) return 'booked';
  if (activeAssignment === seatId) return 'selected';
  const holderId = seatToPassenger[seatId];
  if (holderId && holderId !== activePassengerId) return 'taken';
  return 'available';
}

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
        const status = computeSeatStatus({
          seat,
          bookedSeatIds,
          seatToPassenger,
          activePassengerId,
          activeAssignment,
        });

        const isSelectedByActive = status === 'selected';
        const isSelectedByOther = status === 'taken';
        const isOccupied = status === 'occupied';
        const isBooked = status === 'booked' || status === 'reserved';

        return (
          <Seat
            key={seatId}
            seat={seat}
            status={status}
            isSelectedByActive={isSelectedByActive}
            isSelectedByOther={isSelectedByOther}
            isOccupied={isOccupied}
            isBooked={isBooked}
            onClick={(e) => {
              onSeatClick(seatId);
            }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onSeatMouseEnter(seatId, status, rect.left + rect.width / 2, rect.top);
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
