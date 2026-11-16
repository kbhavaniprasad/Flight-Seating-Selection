import { createContext, useContext, useReducer, useMemo, useEffect } from 'react';
import { bookingReducer, INITIAL_STATE, ACTIONS } from './bookingReducer';
import {
  deriveSeatToPassenger,
  calculateTotal,
  persistBooking,
  loadBooking,
  clearBooking,
} from '../utils/bookingUtils';

export const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [state, dispatch] = useReducer(bookingReducer, INITIAL_STATE);

  // Hydrate persisted booking on mount.
  useEffect(() => {
    const saved = loadBooking();
    if (saved) {
      dispatch({
        type: ACTIONS.SET_PASSENGER_COUNT,
        payload: { count: saved.passengerCount || INITIAL_STATE.passengerCount },
      });
      if (saved.passengers) {
        dispatch({
          type: 'HYDRATE',
          payload: {
            passengers: saved.passengers,
            activePassengerId: saved.activePassengerId,
            assignments: saved.assignments,
            meals: saved.meals,
            layoutId: saved.layoutId || INITIAL_STATE.layoutId,
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist whenever state changes.
  useEffect(() => {
    persistBooking(state);
  }, [state]);

  const seatToPassenger = useMemo(
    () => deriveSeatToPassenger(state.assignments),
    [state.assignments]
  );

  const pricing = useMemo(
    () => calculateTotal(state.assignments, state.meals, state.layoutId),
    [state.assignments, state.meals, state.layoutId]
  );

  const value = useMemo(
    () => ({
      ...state,
      state,
      dispatch,
      seatToPassenger,
      pricing,
      grandTotal: pricing.grandTotal,
    }),
    [state, dispatch, seatToPassenger, pricing]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return ctx;
}
