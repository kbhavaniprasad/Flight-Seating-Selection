import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BookingProvider, useBookings } from './context/BookingContext';
import {
  formatPrice,
  buildSeatsForLayout,
} from './data/seatLayouts';
import {
  SeatMap,
  SeatLegend,
  LayoutToggle,
  PassengerCountSelector,
  PassengerList,
  PricingSummary,
  BookingConfirmation,
  BookingProgressIndicator,
  Skeleton,
  SeatSkeleton,
  ErrorState,
  EmptyState,
} from './components';

/**
 * Toast bus: simple global pub/sub so any component can show toasts without
 * prop drilling.
 */
const listeners = new Set();
let nextToastId = 0;
export function showToast(message, type = 'info', duration = 4000) {
  const toast = { id: ++nextToastId, message, type, duration };
  listeners.forEach((fn) => fn(toast));
}

function ToastBridge() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(
        () =>
          setToasts((prev) => prev.filter((item) => item.id !== toast.id)),
        toast.duration
      );
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border animate-fade-in min-w-[320px] ${
            t.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : t.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
          role="alert"
          aria-live="polite"
        >
          <span className="flex-shrink-0 mt-0.5">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function UserSelectionDialog({ count, onCountChange, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-selection-title"
        className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl"
      >
        <h2 id="user-selection-title" className="text-xl font-bold text-gray-900">
          Select the Number of Passengers
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Choose how many passengers you are booking for.
        </p>
        <label
          htmlFor="initial-passenger-count"
          className="mt-5 block text-sm font-medium text-gray-700"
        >
          Number of passengers
        </label>
        <select
          id="initial-passenger-count"
          value={count}
          onChange={(event) => onCountChange(Number(event.target.value))}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? 'passenger' : 'passengers'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Continue
        </button>
      </section>
    </div>
  );
}

function SeatsPage() {
  const {
    state,
    dispatch,
    seatToPassenger,
    grandTotal,
    pricing,
  } = useBookings();

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [layoutSwitchPending, setLayoutSwitchPending] = useState(null);
  const [confirmationMode, setConfirmationMode] = useState(null);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [showUserSelection, setShowUserSelection] = useState(true);
  const [initialUserCount, setInitialUserCount] = useState(state.passengerCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const submissionInProgress = useRef(false);

  const allPassengersHaveSeats = useMemo(
    () => state.passengers.every((p) => Boolean(state.assignments[p.id])),
    [state.passengers, state.assignments]
  );

  // Determine current booking progress step
  const currentStep = useMemo(() => {
    if (confirmationMode === 'success') return 'confirm';
    if (confirmationMode === 'review') return 'review';
    if (state.passengers.length === 0) return 'passengers';
    if (!allPassengersHaveSeats) return 'seats';
    return 'meals';
  }, [confirmationMode, state.passengers.length, state.assignments, allPassengersHaveSeats]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setStatus('loading');

    async function loadAvailability() {
      if (simulateFailure) {
        setError('Failed to load seat map. Please try again.');
        setStatus('error');
        return;
      }

      try {
        const response = await fetch(
          `/api/seats?layoutId=${encodeURIComponent(state.layoutId)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          // Fall back to mock data when no backend is available
          setBookedSeatIds([]);
          setError(null);
          setStatus('ready');
          return;
        }
        const result = await response.json();
        if (cancelled) return;
        setBookedSeatIds(result.bookedSeatIds || []);
        setError(null);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled || loadError.name === 'AbortError') return;
        // No backend — fall back gracefully to mock data
        setBookedSeatIds([]);
        setError(null);
        setStatus('ready');
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [state.layoutId, simulateFailure, reloadKey]);

  const handleRetry = () => {
    setError(null);
    setStatus('loading');
    setSimulateFailure(false);
    setReloadKey((key) => key + 1);
  };

  const handleToggleFailure = () => setSimulateFailure((v) => !v);

  const handleUserCountConfirm = () => {
    dispatch({ type: 'SET_PASSENGER_COUNT', payload: { count: initialUserCount } });
    setShowUserSelection(false);
  };

  const handleSeatSelect = useCallback(
    (seatId) => {
      if (!state.activePassengerId) {
        showToast('Please select a passenger first before choosing a seat.', 'warning', 3500);
        return;
      }

      const seat = buildSeatsForLayout(state.layoutId).find((s) => s.id === seatId);
      if (!seat) return;

      if (seat.occupied) {
        showToast(`Seat ${seatId} is occupied and cannot be selected.`, 'error', 3500);
        return;
      }

      if (bookedSeatIds.includes(seatId)) {
        showToast(
          `Seat ${seatId} has already been booked. Please choose another seat.`,
          'error',
          3500
        );
        return;
      }

      const holderId = seatToPassenger[seatId];
      if (holderId && holderId !== state.activePassengerId) {
        const holder = state.passengers.find((p) => p.id === holderId);
        showToast(
          `Seat ${seatId} is already assigned to ${holder ? holder.name : 'another passenger'}.`,
          'error',
          3500
        );
        return;
      }

      const alreadyAssigned = state.assignments[state.activePassengerId] === seatId;
      if (alreadyAssigned) {
        dispatch({ type: 'REMOVE_SEAT', payload: { passengerId: state.activePassengerId } });
        showToast(`Seat ${seatId} removed.`, 'success', 3000);
      } else {
        const oldSeat = state.assignments[state.activePassengerId];
        dispatch({ type: 'ASSIGN_SEAT', payload: { seatId, passengerId: state.activePassengerId } });
        if (oldSeat) {
          showToast(`Seat changed from ${oldSeat} to ${seatId}.`, 'success', 3000);
        } else {
          showToast(`Seat ${seatId} assigned (+${formatPrice(seat.price)}).`, 'success', 3000);
        }
      }
    },
    [state, dispatch, seatToPassenger, bookedSeatIds]
  );

  const handleConfirmBooking = async () => {
    if (submissionInProgress.current) return;
    submissionInProgress.current = true;
    setIsSubmitting(true);

    // Validate before confirming
    const { validateBooking } = await import('./utils/bookingUtils');
    const validation = validateBooking(state);
    if (!validation.valid) {
      validation.errors.forEach((err) => showToast(err, 'error', 5000));
      setIsSubmitting(false);
      submissionInProgress.current = false;
      return;
    }

    const passengers = state.passengers.map((passenger) => ({
      passengerId: passenger.id,
      passengerName: passenger.name,
      seatId: state.assignments[passenger.id] || null,
      mealId: state.meals[passenger.id] || 'none',
    }));

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId: state.layoutId, passengers }),
      });
      if (!response.ok) {
        const result = await response.json();
        const bookingError = new Error(result.error || 'Booking could not be confirmed.');
        bookingError.status = response.status;
        throw bookingError;
      }
      setBookedSeatIds((prev) => [
        ...prev,
        ...Object.values(state.assignments).filter((id) => !prev.includes(id)),
      ]);
      setConfirmationMode('success');
    } catch (bookingError) {
      if (bookingError.status === 409) {
        try {
          setReloadKey((key) => key + 1);
        } catch (e) {
          showToast(e.message, 'error');
        }
      }
      showToast(bookingError.message || 'Booking could not be confirmed.', 'error');
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
    setConfirmationMode(null);
  };

  const handleLayoutChange = (nextLayoutId) => {
    if (nextLayoutId === state.layoutId) return;
    const hasAssignments = Object.keys(state.assignments).length > 0;
    if (hasAssignments) {
      setLayoutSwitchPending(nextLayoutId);
      showToast(
        'Switching layouts will clear seat assignments. Confirm to continue.',
        'warning',
        6000
      );
      return;
    }
    dispatch({ type: 'SET_LAYOUT', payload: { layoutId: nextLayoutId } });
  };

  const handleConfirmLayoutSwitch = () => {
    if (layoutSwitchPending) {
      dispatch({ type: 'SET_LAYOUT', payload: { layoutId: layoutSwitchPending } });
      setLayoutSwitchPending(null);
      showToast('Layout switched. Seat assignments were cleared.', 'info', 3000);
    }
  };

  const handleCancelLayoutSwitch = () => {
    setLayoutSwitchPending(null);
  };

  if (status === 'error') {
    return (
      <>
        <ErrorState message={error} onRetry={handleRetry} />
        {showUserSelection && (
          <UserSelectionDialog
            count={initialUserCount}
            onCountChange={setInitialUserCount}
            onConfirm={handleUserCountConfirm}
          />
        )}
      </>
    );
  }

  if (status === 'loading') {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-10">
          <div className="space-y-4">
            <Skeleton className="w-64 h-8" />
            <Skeleton className="w-48 h-4" />
            <div className="grid gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <SeatSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={handleToggleFailure}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {simulateFailure ? 'Simulate: success' : 'Simulate: failure'}
            </button>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 rounded border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
        {showUserSelection && (
          <UserSelectionDialog
            count={initialUserCount}
            onCountChange={setInitialUserCount}
            onConfirm={handleUserCountConfirm}
          />
        )}
      </>
    );
  }

  const hasPassengers = state.passengers.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastBridge />

      {/* Booking Progress Indicator */}
      <BookingProgressIndicator currentStep={currentStep} />

      <header className="bg-white/60 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Flight Seat Selection
              </h1>
              <p className="text-sm text-gray-500">
                Choose your seats, meals, and review your booking
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <PassengerCountSelector />
              <LayoutToggle onLayoutChange={handleLayoutChange} />
              <button
                type="button"
                onClick={handleToggleFailure}
                className="text-xs border border-gray-200 rounded px-3 py-1.5 text-gray-600 hover:bg-gray-50"
              >
                Simulate error
              </button>
            </div>
          </div>
        </div>
      </header>

      {layoutSwitchPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mx-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-amber-600">⚠</span>
            <span className="text-sm font-medium text-amber-800">Confirm layout switch</span>
          </div>
          <p className="text-sm text-amber-700 mb-3">
            Switching to <strong>{layoutSwitchPending}</strong> will clear all current seat
            assignments because seat positions differ between layouts. Meal selections will be
            kept.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmLayoutSwitch}
              className="px-4 py-2 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-700"
            >
              Confirm & Switch
            </button>
            <button
              type="button"
              onClick={handleCancelLayoutSwitch}
              className="px-4 py-2 rounded border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!hasPassengers && (
          <EmptyState message="Add at least one passenger to begin selecting seats." />
        )}

        {hasPassengers && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Aircraft Seat Map (~65-70%) */}
            <section className="lg:col-span-8 space-y-6">
              <SeatMap
                layoutId={state.layoutId}
                state={state}
                seatToPassenger={seatToPassenger}
                bookedSeatIds={bookedSeatIds}
                onSeatSelect={handleSeatSelect}
              />
              <SeatLegend />
            </section>

            {/* Right: Passenger Booking Panel (~30-35%) */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <BookingProgressIndicator currentStep={currentStep} className="hidden lg:block" />
              <PassengerList />
              <PricingSummary
                onConfirm={() => {
                  if (!allPassengersHaveSeats) {
                    showToast(
                      'Please assign a seat to every passenger before confirming.',
                      'warning',
                      4000
                    );
                    return;
                  }
                  setConfirmationMode('review');
                }}
              />
            </aside>
          </div>
        )}

        {confirmationMode && (
          <BookingConfirmation
            mode={confirmationMode}
            passengers={state.passengers}
            assignments={state.assignments}
            pricing={pricing}
            onEdit={() => setConfirmationMode(null)}
            onConfirm={handleConfirmBooking}
            onStartOver={handleStartOver}
            isSubmitting={isSubmitting}
          />
        )}

        {showUserSelection && (
          <UserSelectionDialog
            count={initialUserCount}
            onCountChange={setInitialUserCount}
            onConfirm={handleUserCountConfirm}
          />
        )}
      </main>

      {/* Mobile bottom bar with total and confirm button */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-5 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
        aria-live="polite"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Booking total</span>
          <span className="text-lg font-bold text-gray-900">{formatPrice(grandTotal)}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!allPassengersHaveSeats) {
              showToast(
                'Please assign a seat to every passenger before confirming.',
                'warning',
                4000
              );
              return;
            }
            setConfirmationMode('review');
          }}
          disabled={!allPassengersHaveSeats}
          className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${
            allPassengersHaveSeats
              ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {allPassengersHaveSeats ? 'Review & confirm' : 'Complete seat selection first'}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BookingProvider>
      <SeatsPage />
    </BookingProvider>
  );
}
