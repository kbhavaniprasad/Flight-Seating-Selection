import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { BookingProvider, useBookings } from './context/BookingContext';
import { buildSeatsForLayout } from './data/seatLayouts';
import { SeatsPage } from './pages/SeatsPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { PaymentPage } from './pages/PaymentPage';
import { BookingSuccessPage } from './pages/BookingSuccessPage';
import { UserSelectionDialog } from './components/UserSelectionDialog';
import { showToast } from './components/ToastBridge';
import { apiUrl } from './config/api';

/**
 * Top-level booking application.
 *
 * Workflow (page-based routing, no external router dependency):
 *   1. Passenger selection dialog  →  SeatsPage  →  BookingConfirmationPage
 *   2. PaymentPage                 →  BookingSuccessPage
 *
 * Seats are persisted to the database only after a verified successful payment
 * response is received from the backend.
 */
export default function App() {
  return (
    <BookingProvider>
      <AppContent />
    </BookingProvider>
  );
}

function AppContent() {
  const {
    state,
    dispatch,
    seatToPassenger,
    pricing,
    grandTotal,
  } = useBookings();

  // Page-based routing: 'seats' | 'confirmation' | 'payment' | 'success'
  const [page, setPage] = useState('seats');
  const [showUserSelection, setShowUserSelection] = useState(true);
  const [initialUserCount, setInitialUserCount] = useState(state.passengerCount);

  // Reload key forces SeatsPage to re-fetch seat availability (e.g. after a
  // booking conflict frees no seats, or when returning to the seat map).
  const [reloadKey, setReloadKey] = useState(0);

  // Booking workflow state
  const [pendingBooking, setPendingBooking] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Idempotency: never process the same payment transaction twice.
  const processedTransactionId = useRef(null);

  const allPassengersHaveSeats = useMemo(
    () => state.passengers.every((p) => Boolean(state.assignments[p.id])),
    [state.passengers, state.assignments]
  );

  useEffect(() => {
    setPaymentError(null);
  }, [page]);

  /* ------------------------------------------------------------------ */
  /* Step 1: Passenger selection                                        */
  /* ------------------------------------------------------------------ */

  const handleUserCountConfirm = () => {
    dispatch({ type: 'SET_PASSENGER_COUNT', payload: { count: initialUserCount } });
    setShowUserSelection(false);
    setPage('seats');
  };

  /* ------------------------------------------------------------------ */
  /* Step 2 → 3: Validate and open the booking confirmation page        */
  /* ------------------------------------------------------------------ */

  const handleGoToConfirmation = useCallback((bookedSeatIds = []) => {
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

    // Root-cause validation: no selected seat is occupied or already booked.
    const seats = buildSeatsForLayout(state.layoutId);
    const invalidSelection = Object.values(state.assignments).some((seatId) => {
      const seat = seats.find((s) => s.id === seatId);
      return !seat || seat.occupied || bookedSeatIds.includes(seatId);
    });
    if (invalidSelection) {
      showToast(
        'One or more selected seats are no longer available. Please refresh the seat map and choose again.',
        'error',
        4000
      );
      return;
    }

    setPage('confirmation');
  }, [state, allPassengersHaveSeats]);

  /* ------------------------------------------------------------------ */
  /* Step 3 → 4: Proceed to payment                                     */
  /* ------------------------------------------------------------------ */

  const handleProceedToPayment = (bookingData) => {
    setPaymentError(null);
    setPendingBooking(bookingData);
    setPage('payment');
  };

  const handleBackToSeats = () => {
    setPage('seats');
    setPaymentError(null);
    setReloadKey((key) => key + 1);
  };

  /* ------------------------------------------------------------------ */
  /* Step 4 → 5: Verify payment, then persist the booking               */
  /* ------------------------------------------------------------------ */

  const handlePaymentSuccess = async (paymentResult) => {
    // Idempotency guard.
    if (processedTransactionId.current === paymentResult.transactionId) return;
    processedTransactionId.current = paymentResult.transactionId;

    setIsProcessing(true);
    try {
      const bookingPayload = {
        layoutId: pendingBooking.layoutId,
        passengers: pendingBooking.passengers.map((passenger) => {
          const seatId = pendingBooking.assignments[passenger.id] || null;
          return {
            passengerId: passenger.id,
            passengerName: passenger.name,
            seatId,
            mealId: state.meals[passenger.id] || 'none',
          };
        }),
      };

      const response = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const result = await response.json();
        if (response.status === 409) {
          // Seats taken by another user between selection and payment.
          setPaymentError(
            'One or more seats were just booked by another user. Please choose different seats.'
          );
          setPage('seats');
          setReloadKey((key) => key + 1);
          return;
        }
        throw new Error(result.error || 'Booking could not be confirmed.');
      }

      const bookingResult = await response.json();

      setConfirmedBooking({
        ...paymentResult,
        ...bookingResult,
        passengers: bookingPayload.passengers,
        grandTotal: pendingBooking.grandTotal,
        seatTotal: pendingBooking.seatTotal,
        mealTotal: pendingBooking.mealTotal,
        taxAmount: pendingBooking.taxAmount,
        lineItems: pendingBooking.lineItems || [],
        journey: pendingBooking.journey,
      });
      setPage('success');
    } catch (bookingError) {
      setPaymentError(bookingError.message || 'Booking could not be confirmed. Please try again.');
      setPage('confirmation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentFailure = (message) => {
    setPaymentError(message);
    setPage('confirmation');
  };

  const handleCancelPayment = () => {
    setPage('confirmation');
    setPaymentError(null);
  };

  const handleStartOver = () => {
    dispatch({ type: 'RESET' });
    setPage('seats');
    setPendingBooking(null);
    setConfirmedBooking(null);
    setPaymentError(null);
    processedTransactionId.current = null;
    setShowUserSelection(true);
    setInitialUserCount(state.passengerCount);
  };

  const hasPassengers = state.passengers.length > 0;

  return (
      <div className="min-h-screen bg-gray-50">
        {showUserSelection && page === 'seats' && (
          <UserSelectionDialog
            count={initialUserCount}
            onCountChange={setInitialUserCount}
            onConfirm={handleUserCountConfirm}
          />
        )}

        {page === 'seats' && (
          <SeatsPage
            reloadKey={reloadKey}
            onNext={handleGoToConfirmation}
          />
        )}

        {page === 'confirmation' && hasPassengers && (
          <BookingConfirmationPage
            passengers={state.passengers}
            assignments={state.assignments}
            pricing={pricing}
            layoutId={state.layoutId}
            onBack={handleBackToSeats}
            onProceedToPayment={handleProceedToPayment}
            isProcessing={isProcessing}
          />
        )}

        {page === 'payment' && pendingBooking && (
          <PaymentPage
            booking={pendingBooking}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            onCancel={handleCancelPayment}
            isProcessing={isProcessing}
          />
        )}

        {page === 'success' && confirmedBooking && (
          <BookingSuccessPage
            booking={confirmedBooking}
            onStartOver={handleStartOver}
          />
        )}
      </div>
  );
}
