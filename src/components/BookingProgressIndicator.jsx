const STEPS = [
  { id: 'passengers', label: '1. Select Passengers' },
  { id: 'seats', label: '2. Choose Seats' },
  { id: 'confirmation', label: '3. Booking Confirmation' },
  { id: 'payment', label: '4. Payment' },
  { id: 'success', label: '5. Booking Successful' },
];

export function BookingProgressIndicator({ currentStep }) {
  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const activeIndex = stepIndex >= 0 ? stepIndex : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium leading-tight text-center ${
                      isActive
                        ? 'text-blue-600'
                        : isCompleted
                          ? 'text-slate-600'
                          : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-10 h-px ${
                        isCompleted || isActive ? 'bg-blue-300' : 'bg-slate-200'
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

BookingProgressIndicator.displayName = 'BookingProgressIndicator';
