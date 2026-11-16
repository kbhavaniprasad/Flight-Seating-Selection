import { memo } from 'react';
import { formatPrice, getCategoryConfig } from '../data/seatLayouts';

/**
 * Single seat button with professional airline styling.
 *
 * States:
 *  - available: selectable (category-colored tint)
 *  - occupied: pre-occupied by airline, disabled (muted gray)
 *  - selected-by-active: selected by the active passenger (strong blue)
 *  - selected-by-other: held by another passenger (soft red)
 *  - booked: booked by another user (dark gray, not selectable)
 *
 * Category is shown via a small letter badge on the seat (S/P/E).
 */
export const Seat = memo(function Seat({
  seat,
  isSelectedByActive,
  isSelectedByOther,
  isOccupied,
  isBooked,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) {
  const { category, price, letter, id, occupied } = seat;
  const config = getCategoryConfig(category);

  const status = isBooked
    ? 'booked'
    : isOccupied || occupied
      ? 'occupied'
      : isSelectedByActive
        ? 'selected'
        : isSelectedByOther
          ? 'taken'
          : 'available';

  const isDisabled = status === 'occupied' || status === 'booked' || status === 'taken';

  let fillClasses = '';

  if (status === 'occupied' || status === 'booked') {
    fillClasses =
      'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60';
  } else if (status === 'selected') {
    fillClasses =
      'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)] ring-2 ring-blue-100';
  } else if (status === 'taken') {
    fillClasses =
      'bg-red-50 border-red-200 text-red-500 cursor-not-allowed';
  } else {
    // Available seat — category color
    const availableClasses = {
      standard: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300',
      premium:
        'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300',
      extraLegroom:
        'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100 hover:border-purple-300',
    };
    fillClasses = availableClasses[category] || availableClasses.standard;
  }

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick && !isDisabled) onClick();
  };

  const handleMouseEnter = (e) => {
    e.stopPropagation();
    if (onMouseEnter) onMouseEnter();
  };

  const handleMouseLeave = (e) => {
    e.stopPropagation();
    if (onMouseLeave) onMouseLeave();
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={status === 'selected' ? 'true' : 'false'}
      aria-label={
        status === 'available'
          ? `Seat ${id}, ${config.label}, ${formatPrice(price)}, available`
          : `Seat ${id}, ${config.label}, occupied, not available`
      }
      aria-disabled={isDisabled ? 'true' : 'false'}
      className={`
        seat-btn relative w-10 h-10 min-w-10 min-h-10 rounded-lg border-2
        transition-all duration-150 active:scale-95 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-offset-2
        ${fillClasses}
        ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${isSelectedByActive ? 'animate-pulse' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="font-bold text-sm">{letter}</span>
      {/* Category badge on the seat itself (S = Standard, P = Premium, E = Extra Legroom) */}
      <span
        className={`absolute top-1 right-1 text-[9px] font-bold leading-none ${
          status === 'selected' || status === 'taken' || status === 'occupied' || status === 'booked'
            ? 'text-white/70'
            : 'text-current/60'
        }`}
        aria-hidden="true"
      >
        {category.charAt(0).toUpperCase()}
      </span>
    </button>
  );
});

Seat.displayName = 'Seat';
