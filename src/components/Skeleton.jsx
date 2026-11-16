export function Skeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  );
}

export function SeatSkeleton() {
  return (
    <div className="flex items-center gap-1 px-2">
      <span className="w-10 h-4 rounded bg-gray-200" />
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <span key={i} className="w-4 h-4 rounded-full bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
