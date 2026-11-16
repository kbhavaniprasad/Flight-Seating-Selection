export function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <span className="text-2xl text-gray-400">💺</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{message || 'No data available'}</h3>
      <p className="text-gray-500 max-w-xs">Adjust your passenger count or layout to begin.</p>
    </div>
  );
}
