import { getCategoryConfig, SEAT_CATEGORIES } from '../data/seatLayouts';

export function SeatLegend() {
  const standard = getCategoryConfig(SEAT_CATEGORIES.STANDARD);
  const premium = getCategoryConfig(SEAT_CATEGORIES.PREMIUM);
  const extra = getCategoryConfig(SEAT_CATEGORIES.EXTRA_LEGROOM);

  const items = [
    { label: 'Available', dot: 'bg-green-500', desc: 'Selectable seat' },
    { label: 'Your seat', dot: 'bg-blue-600', desc: 'Selected for active passenger' },
    { label: 'Taken', dot: 'bg-red-500', desc: 'Assigned to another passenger' },
    { label: 'Occupied', dot: 'bg-gray-400', desc: 'Not available (airline blocked)' },
    {
      label: standard.label,
      dot: 'border border-green-300 bg-green-50',
      desc: standard.description,
    },
    {
      label: premium.label,
      dot: 'border border-amber-300 bg-amber-50',
      desc: premium.description,
    },
    {
      label: extra.label,
      dot: 'border border-purple-300 bg-purple-50',
      desc: extra.description,
    },
  ];

  return (
    <section className="flex flex-wrap gap-2 md:gap-3 items-center">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Seat legend
      </span>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className={`w-4 h-4 rounded shrink-0 border ${item.dot}`}
            title={item.label}
            aria-label={item.label}
          />
          <span className="text-xs text-gray-600 leading-none">{item.label}</span>
        </div>
      ))}
    </section>
  );
}
