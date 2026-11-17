import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBookings } from '../context/BookingContext';
import {
  formatPrice,
  buildSeatsForLayout,
} from '../data/seatLayouts';
import {
  SeatMap,
  SeatLegend,
  LayoutToggle,
  PassengerCountSelector,
  PassengerList,
  PricingSummary,
  BookingProgressIndicator,
  Skeleton,
  SeatSkeleton,
  ErrorState,
  EmptyState,
} from '../components';
import { showToast } from '../components/ToastBridge';

const API_BASE_URL = import.meta.env.DEV
  ? ''
  : 'https://flight-seating-selection.onrender.com';

/**
 * Seat selection page (Step 2 of the booking workflow).
 *
 * Receives `onNext` (called after successful validation to open the booking
 * confirmation page) and `reloadKey` (forces a seat-availability re-fetch).
 */
export function SeatsPage({ reloadKey = 0, onNext }) {
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
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const submissionInProgress = useRef(false);

  const allPassengersHaveSeats = useMemo(
    () => state.passengers.every((p) => Boolean(state.assignments[p.id])),
    [state.passengers, state.assignments]
  );

  const selectedSeatCount = useMemo(
    () => Object.keys(state.assignments).length,
    [state.assignments]
  );

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
          `${API_BASE_URL}/api/seats?layoutId=${encodeURIComponent(state.layoutId)}`,
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
  };

  const handleToggleFailure = () => setSimulateFailure((v) => !v);

  const handleSeatSelect = useCallback(
    (seatId) => {
      if (!state.activePassengerId) {
        showToast('Please select a passenger first before choosing a seat.', 'warning', 3500);
        return;
      }

      const seat = buildSeatsForLayout(state.layoutId).find((s) => s.id === seatId);
      if (!seat) return;

      // Hard block: occupied / pre-booked seats can never be selected.
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

      // Selection limit: a user may not select more seats than the passenger
      // count, unless they are changing their own existing selection.
      const alreadyAssigned = state.assignments[state.activePassengerId] === seatId;
      if (!alreadyAssigned && selectedSeatCount >= state.passengerCount) {
        showToast(
          `You have already selected ${selectedSeatCount} of ${state.passengerCount} seat${
            state.passengerCount === 1 ? '' : 's'
          }. Deselect a seat before choosing another.`,
          'warning',
          3500
        );
        return;
      }

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
    [state, dispatch, seatToPassenger, bookedSeatIds, selectedSeatCount]
  );

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
      </>
    );
  }

  if (status === 'loading') {
    return (
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
    );
  }

  const hasPassengers = state.passengers.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Booking Progress Indicator */}
      <BookingProgressIndicator currentStep="seats" />

      <header className="bg-white/60 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Select your seats
              </h1>
              <p className="text-sm text-gray-500">
                Choose {state.passengerCount} seat{state.passengerCount === 1 ? '' : 's'} for your
                {state.passengerCount} passenger{state.passengerCount === 1 ? '' : 's'}.
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
            assignments because seat positions differ between layouts.
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
            {/* Left: Aircraft Seat Map */}
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

            {/* Right: Passenger Booking Panel */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              <PassengerList />
              <PricingSummary
                onNext={() => {
                  if (!allPassengersHaveSeats) {
                    showToast(
                      `Please assign a seat to all ${state.passengerCount} passenger${
                        state.passengerCount === 1 ? '' : 's'
                      } before continuing.`,
                      'warning',
                      4000
                    );
                    return;
                  }
                  onNext(bookedSeatIds);
                }}
              />
            </aside>
          </div>
        )}
      </main>

      {/* Mobile bottom bar with selection counter and next action */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-5 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
        aria-live="polite"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            {selectedSeatCount} of {state.passengerCount} seat{state.passengerCount === 1 ? '' : 's'} selected
          </span>
          <span className="text-lg font-bold text-gray-900">{formatPrice(grandTotal)}</span>
        </div>
        <button
          type="button"
          onClick={() => onNext(bookedSeatIds)}
          disabled={!allPassengersHaveSeats}
          className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all ${
            allPassengersHaveSeats
              ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {allPassengersHaveSeats ? 'Next: Review booking' : 'Complete seat selection first'}
        </button>
      </div>
    </div>
  );
}

SeatsPage.displayName = 'SeatsPage';
