import { describe, it, expect } from 'vitest';
import {
  bookingReducer,
  calculateTotal,
  ACTIONS,
  INITIAL_STATE,
} from '../utils/bookingUtils';

describe('bookingReducer', () => {
  it('should return the initial state', () => {
    const result = bookingReducer(undefined, { type: '@@INIT' });
    expect(result).toEqual(INITIAL_STATE);
  });

  it('SET_PASSENGER_COUNT should add passengers', () => {
    const state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_PASSENGER_COUNT,
      payload: { count: 3 },
    });
    expect(state.passengerCount).toBe(3);
    expect(state.passengers.length).toBe(3);
    expect(state.passengers[2].name).toBe('Passenger 3');
    expect(state.activePassengerId).toBe('p1');
  });

  it('SET_PASSENGER_COUNT should clamp between 1 and 9', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_PASSENGER_COUNT,
      payload: { count: 0 },
    });
    expect(state.passengerCount).toBe(1);

    state = bookingReducer(state, {
      type: ACTIONS.SET_PASSENGER_COUNT,
      payload: { count: 100 },
    });
    expect(state.passengerCount).toBe(9);
  });

  it('reducing passenger count releases seats and meals of removed passengers', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_PASSENGER_COUNT,
      payload: { count: 3 },
    });
    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A', passengerId: 'p3' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.SET_MEAL,
      payload: { passengerId: 'p3', mealId: 'vegan' },
    });

    expect(state.assignments['p3']).toBe('1A');
    expect(state.meals['p3']).toBe('vegan');

    state = bookingReducer(state, {
      type: ACTIONS.SET_PASSENGER_COUNT,
      payload: { count: 2 },
    });

    expect(state.passengerCount).toBe(2);
    expect(state.passengers.length).toBe(2);
    expect(state.assignments['p3']).toBeUndefined();
    expect(state.meals['p3']).toBeUndefined();
    // active passenger should fall back if removed
    expect(state.activePassengerId).toBe('p1');
  });

  it('SET_ACTIVE_PASSENGER should change active passenger', () => {
    const state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_ACTIVE_PASSENGER,
      payload: { passengerId: 'p1' },
    });
    expect(state.activePassengerId).toBe('p1');
  });

  it('SET_PASSENGER_NAME should persist a trimmed name', () => {
    const state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_PASSENGER_NAME,
      payload: { passengerId: 'p1', name: '  Alex  ' },
    });
    expect(state.passengers[0].name).toBe('Alex');
  });

  it('ASSIGN_SEAT should assign a seat to active passenger', () => {
    const state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A', passengerId: 'p1' },
    });
    expect(state.assignments['p1']).toBe('1A');
  });

  it('ASSIGN_SEAT should reject occupied and unknown seats', () => {
    const occupied = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '3A', passengerId: 'p1' },
    });
    const unknown = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '99Z', passengerId: 'p1' },
    });
    expect(occupied.assignments).toEqual({});
    expect(unknown.assignments).toEqual({});
  });

  it('auto-advances to the next passenger without a seat after assignment', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_PASSENGER_COUNT,
      payload: { count: 3 },
    });

    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A' },
    });
    expect(state.activePassengerId).toBe('p2');

    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1C' },
    });
    expect(state.activePassengerId).toBe('p3');

    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1E' },
    });
    expect(state.assignments).toEqual({ p1: '1A', p2: '1C', p3: '1E' });
    expect(state.activePassengerId).toBe('p3');
    expect(calculateTotal(state.assignments, state.meals, state.layoutId).grandTotal).toBe(600);
  });

  it('should prevent double-booking (one seat per passenger)', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_PASSENGER_COUNT,
      payload: { count: 2 },
    });
    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A', passengerId: 'p1' },
    });
    // p2 tries to take 1A -> blocked
    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A', passengerId: 'p2' },
    });
    expect(state.assignments['p2']).toBeUndefined();
    expect(state.assignments['p1']).toBe('1A');
  });

  it('one seat per passenger: assigning a new seat replaces the old', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A', passengerId: 'p1' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '2B', passengerId: 'p1' },
    });
    expect(state.assignments['p1']).toBe('2B');
    // old seat 1A is now free (no one holds it)
    const holder = Object.values(state.assignments).find((s) => s === '1A');
    expect(holder).toBeUndefined();
  });

  it('replacing one passenger seat preserves the other passengers assignments', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_PASSENGER_COUNT,
      payload: { count: 3 },
    });
    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1C' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1E' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.SET_ACTIVE_PASSENGER,
      payload: { passengerId: 'p2' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '2B' },
    });

    expect(state.assignments).toEqual({ p1: '1A', p2: '2B', p3: '1E' });
    expect(state.activePassengerId).toBe('p2');
  });

  it('REMOVE_SEAT should unassign a passenger', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A', passengerId: 'p1' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.REMOVE_SEAT,
      payload: { passengerId: 'p1' },
    });
    expect(state.assignments['p1']).toBeUndefined();
  });

  it('SET_LAYOUT should clear seats but preserve passenger meals', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A', passengerId: 'p1' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.SET_MEAL,
      payload: { passengerId: 'p1', mealId: 'vegan' },
    });
    state = bookingReducer(state, {
      type: ACTIONS.SET_LAYOUT,
      payload: { layoutId: '2-3-2' },
    });
    expect(state.layoutId).toBe('2-3-2');
    expect(state.assignments).toEqual({});
    expect(state.meals).toEqual({ p1: 'vegan' });
  });

  it('SET_MEAL should set a meal for a passenger', () => {
    const state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.SET_MEAL,
      payload: { passengerId: 'p1', mealId: 'vegan' },
    });
    expect(state.meals['p1']).toBe('vegan');
  });

  it('RESET should return to initial state', () => {
    let state = bookingReducer(INITIAL_STATE, {
      type: ACTIONS.ASSIGN_SEAT,
      payload: { seatId: '1A', passengerId: 'p1' },
    });
    state = bookingReducer(state, { type: ACTIONS.RESET, payload: {} });
    expect(state).toEqual(INITIAL_STATE);
  });
});
