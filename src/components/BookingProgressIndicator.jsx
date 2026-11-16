const STEPS = [
  { id: 'passengers', label: '1. Select Passengers' },
  { id: 'seats', label: '2. Choose Seats' },
  { id: 'meals', label: '3. Select Meals' },
  { id: 'review', label: '4. Review Booking' },
  { id: 'confirm', label: '5. Confirm' },
];

export function BookingProgressIndicator({ currentStep }) {
  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const activeIndex = stepIndex >= 0 ? stepIndex : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Booking progress
          </p>
        </div>
        <div className="flex-1 max-w-md mx-auto">
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => {
              const isActive = index === activeIndex;
              const isCompleted = index < activeIndex;
              return (
                <div key={step.id} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span
                    className={`text-xs font-medium leading-tight text-center ${
                      isActive
                        ? 'text-blue-600'
                        : isCompleted
                          ? 'text-gray-600'
                          : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-12 h-px ${
                        isCompleted || isActive ? 'bg-blue-300' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
