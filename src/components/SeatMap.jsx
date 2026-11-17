import { useState, useMemo, memo } from 'react';
import {
  buildSeatsForLayout,
  COLUMN_GROUPS,
  formatPrice,
  getCategoryConfig,
} from '../data/seatLayouts';
import { SeatRow } from './SeatRow';
import { SeatTooltip } from './SeatTooltip';

/**
 * Groups base seats by row and interleaves aisle markers based on COLUMN_GROUPS.
 */
function buildRows(layoutId) {
  const seats = buildSeatsForLayout(layoutId);
  const groups = COLUMN_GROUPS[layoutId];
  const byRow = new Map();
  for (const s of seats) {
    if (!byRow.has(s.row)) byRow.set(s.row, []);
    byRow.get(s.row).push(s);
  }

  return Array.from(byRow.entries()).map(([row, rowSeats]) => {
    const expanded = [];
    for (const group of groups) {
      if (group.type === 'aisle') {
        expanded.push({ type: 'aisle' });
      } else {
        const found = rowSeats.find((s) => s.letter === group.letter);
        if (found) expanded.push(found);
      }
    }
    return { row, seats: expanded };
  });
}

/**
 * Compute the live tooltip status for a seat from the actual seat data.
 */
function tooltipStatusFor(seatId, { state, seatToPassenger, bookedSeatIds }) {
  const seat = buildSeatsForLayout(state.layoutId).find((s) => s.id === seatId);
  if (!seat) return 'available';
  if (seat.occupied) return 'occupied';
  if (bookedSeatIds.includes(seatId)) return 'booked';
  const activeAssignment = state.assignments[state.activePassengerId];
  if (activeAssignment === seatId) return 'selected';
  const holderId = seatToPassenger[seatId];
  if (holderId && holderId !== state.activePassengerId) return 'taken';
  return 'available';
}

export const SeatMap = memo(function SeatMap({
  layoutId,
  state,
  seatToPassenger,
  bookedSeatIds = [],
  onSeatSelect,
}) {
  const [hoveredSeatId, setHoveredSeatId] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const rows = useMemo(() => buildRows(layoutId), [layoutId]);

  const activeAssignment = state.assignments[state.activePassengerId];

  const allSeats = useMemo(() => buildSeatsForLayout(layoutId), [layoutId]);

  // The tooltip status is always derived from live seat data, never hardcoded.
  const seatDetail = useMemo(() => {
    if (!hoveredSeatId) return null;
    const found = allSeats.find((s) => s.id === hoveredSeatId);
    if (!found) return null;
    const status = tooltipStatusFor(hoveredSeatId, {
      state,
      seatToPassenger,
      bookedSeatIds,
    });
    return { ...found, status };
  }, [hoveredSeatId, allSeats, state, seatToPassenger, bookedSeatIds]);

  const handleSeatClick = (seatId) => onSeatSelect(seatId);

  const handleTooltipPosition = (id, status, x, y) => {
    setHoveredSeatId(id);
    if (x !== undefined && y !== undefined) {
      setTooltipPosition({ x, y });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Aircraft Seat Map
        </h2>
        <span className="text-xs text-gray-500">
          Front of aircraft
        </span>
      </div>

      {/* Seat map container - centered */}
      <div className="flex flex-col items-center">
        <div
          className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm"
          style={{ minHeight: '420px' }}
        >
          <div className="p-4 md:p-6 space-y-3">
            {rows.map((r) => (
              <SeatRow
                key={r.row}
                row={r.row}
                seats={r.seats}
                state={state}
                seatToPassenger={seatToPassenger}
                bookedSeatIds={bookedSeatIds}
                activePassengerId={state.activePassengerId}
                onSeatClick={handleSeatClick}
                onSeatMouseEnter={handleTooltipPosition}
                onSeatMouseLeave={() => setHoveredSeatId(null)}
              />
            ))}
            <div className="h-4" />
          </div>
        </div>
      </div>

      {/* Floating tooltip positioned near the hovered seat. Status comes from live data. */}
      {seatDetail && hoveredSeatId && (
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: tooltipPosition.x,
            top: tooltipPosition.y - 170,
            transform: 'translateX(-50%)',
          }}
        >
          <SeatTooltip seat={seatDetail} status={seatDetail.status} />
        </div>
      )}

      {state.activePassengerId && activeAssignment && (
        <p className="text-xs text-gray-500 mt-2">
          Active selection: <span className="font-medium text-blue-600">{activeAssignment}</span>
        </p>
      )}
    </div>
  );
});

SeatMap.displayName = 'SeatMap';
