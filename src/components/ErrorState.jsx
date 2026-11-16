export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-6 max-w-xs">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors shadow-md"
      >
        Retry
      </button>
    </div>
  );
}
