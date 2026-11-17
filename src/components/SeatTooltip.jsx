import { memo } from 'react';
import { formatPrice, getCategoryConfig } from '../data/seatLayouts';

export const SeatTooltip = memo(function SeatTooltip({ seat, status }) {
  const config = getCategoryConfig(seat.category);

  const statusConfig = {
    available: { label: 'Available', color: 'text-green-600', bg: 'bg-green-50' },
    occupied: { label: 'Occupied', color: 'text-gray-500', bg: 'bg-gray-50' },
    booked: { label: 'Booked', color: 'text-red-600', bg: 'bg-red-50' },
    reserved: { label: 'Reserved', color: 'text-amber-600', bg: 'bg-amber-50' },
    selected: { label: 'Selected', color: 'text-blue-600', bg: 'bg-blue-50' },
    taken: { label: 'Taken by another passenger', color: 'text-red-600', bg: 'bg-red-50' },
  };

  const statusInfo = statusConfig[status] || statusConfig.available;

  return (
    <div
      className="absolute z-50 p-3 rounded-xl bg-white border border-gray-200 shadow-xl min-w-[210px] animate-fade-in"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-gray-900">{seat.id}</span>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded uppercase ${statusInfo.color} ${statusInfo.bg}`}
        >
          {statusInfo.label}
        </span>
      </div>
      <div className="mb-2">
        <span className="text-xs text-gray-500 block">Category</span>
        <span className="text-sm font-medium text-gray-900">{config.label}</span>
      </div>
      <div className="mb-2">
        <span className="text-xs text-gray-500 block">Price</span>
        <span className="text-sm font-medium text-gray-900">
          {config.price === 0 ? 'Complimentary' : formatPrice(config.price)}
        </span>
      </div>
      <div className="pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-500 block mb-1">Details</span>
        <p className="text-xs text-gray-600">{config.description}</p>
      </div>
    </div>
  );
});

SeatTooltip.displayName = 'SeatTooltip';
