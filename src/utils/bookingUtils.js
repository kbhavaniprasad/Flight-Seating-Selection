/**
 * Pure, testable business utilities for seat assignment & pricing.
 * These have no React dependencies and can be unit-tested directly.
 */

import { CATEGORY_LABELS, buildSeatsForLayout } from '../data/seatLayouts';
import { MEALS } from '../data/meals';

export const ACTIONS = {
  SET_PASSENGER_COUNT: 'SET_PASSENGER_COUNT',
  SET_ACTIVE_PASSENGER: 'SET_ACTIVE_PASSENGER',
  SET_PASSENGER_NAME: 'SET_PASSENGER_NAME',
  HYDRATE: 'HYDRATE',
  ASSIGN_SEAT: 'ASSIGN_SEAT',
  REMOVE_SEAT: 'REMOVE_SEAT',
  SET_LAYOUT: 'SET_LAYOUT',
  SET_MEAL: 'SET_MEAL',
  RESET: 'RESET',
};

export const INITIAL_STATE = {
  layoutId: '3-2',
  passengerCount: 1,
  passengers: [{ id: 'p1', name: 'Passenger 1' }],
  activePassengerId: 'p1',
  assignments: {},
  meals: {},
};

export function nextPassengerId(passengers) {
  const max = passengers.reduce((maxId, p) => {
    const n = Number(p.id.replace('p', ''));
    return n > maxId ? n : maxId;
  }, 0);
  return `p${max + 1}`;
}

/**
 * Validate whether a seat can be assigned to a passenger.
 * Returns { ok: boolean, reason?: string }.
 */
export function canAssignSeat(state, seatId, passengerId, seats = buildSeatsForLayout(state.layoutId)) {
  const { assignments, passengers, activePassengerId } = state;

  const targetPassengerId = passengerId || activePassengerId;
  const passenger = passengers.find((p) => p.id === targetPassengerId);
  if (!passenger) {
    return { ok: false, reason: 'Passenger not found.' };
  }

  const seat = seats.find((candidate) => candidate.id === seatId);
  if (!seat) {
    return { ok: false, reason: `Seat ${seatId} does not exist in this layout.` };
  }
  if (seat.occupied) {
    return { ok: false, reason: `Seat ${seatId} is occupied.` };
  }

  // Already assigned to this passenger -> treated as removal/change intent,
  // not an error. The caller decides based on current assignment.
  const current = assignments[targetPassengerId];
  if (current === seatId) {
    return { ok: true, reason: 'alreadyAssigned' };
  }

  // Seat held by another passenger
  const holder = Object.entries(assignments).find(([, sid]) => sid === seatId);
  if (holder) {
    const [holderId] = holder;
    const holderName = passengers.find((p) => p.id === holderId)?.name || 'another passenger';
    return {
      ok: false,
      reason: `Seat ${seatId} is already assigned to ${holderName}.`,
    };
  }

  return { ok: true };
}

/**
 * Compute derived seat -> passengerId lookup.
 */
export function deriveSeatToPassenger(assignments) {
  const map = {};
  for (const [pid, seatId] of Object.entries(assignments)) {
    if (seatId) map[seatId] = pid;
  }
  return map;
}

/**
 * Reducer. Pure.
 */
export function bookingReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_PASSENGER_COUNT: {
      const { count } = action.payload;
      const clamped = Math.max(1, Math.min(9, Number(count) || 1));
      const currentCount = state.passengers.length;
      let passengers = [...state.passengers];

      if (clamped > currentCount) {
        for (let i = currentCount + 1; i <= clamped; i++) {
          passengers.push({ id: nextPassengerId(passengers), name: `Passenger ${i}` });
        }
      } else if (clamped < currentCount) {
        passengers = passengers.slice(0, clamped);
      }

      // Release seats/meals of removed passengers
      const removedIds = state.passengers
        .slice(clamped)
        .map((p) => p.id);
      let assignments = { ...state.assignments };
      let meals = { ...state.meals };
      for (const id of removedIds) {
        delete assignments[id];
        delete meals[id];
      }

      let activePassengerId = state.activePassengerId;
      if (!passengers.find((p) => p.id === activePassengerId)) {
        activePassengerId = passengers.length > 0 ? passengers[0].id : null;
      }

      return {
        ...state,
        passengerCount: clamped,
        passengers,
        assignments,
        meals,
        activePassengerId,
      };
    }

    case ACTIONS.SET_ACTIVE_PASSENGER: {
      const { passengerId } = action.payload;
      if (passengerId !== null && !state.passengers.some((p) => p.id === passengerId)) return state;
      return {
        ...state,
        activePassengerId: passengerId,
      };
    }

    case ACTIONS.HYDRATE: {
      const { passengers, activePassengerId, assignments, meals, layoutId } =
        action.payload;
      return {
        ...state,
        layoutId: layoutId || state.layoutId,
        passengerCount: passengers ? passengers.length : state.passengerCount,
        passengers: passengers || state.passengers,
        activePassengerId:
          activePassengerId && passengers?.some((p) => p.id === activePassengerId)
            ? activePassengerId
            : passengers?.[0]?.id || null,
        assignments: assignments || {},
        meals: meals || {},
      };
    }

    case ACTIONS.SET_PASSENGER_NAME: {
      const { passengerId, name } = action.payload;
      const normalizedName = typeof name === 'string' ? name.trim() : '';
      if (!normalizedName || !state.passengers.some((p) => p.id === passengerId)) return state;
      return {
        ...state,
        passengers: state.passengers.map((p) =>
          p.id === passengerId ? { ...p, name: normalizedName } : p
        ),
      };
    }

    case ACTIONS.ASSIGN_SEAT: {
      const { seatId, passengerId } = action.payload;
      const targetId = passengerId || state.activePassengerId;
      if (!targetId) return state;

      const validation = canAssignSeat(state, seatId, targetId);
      if (!validation.ok) return state;
      if (validation.reason === 'alreadyAssigned') return state;

      // Remove any existing seat for this passenger (one seat per passenger)
      const oldSeat = state.assignments[targetId];
      const assignments = { ...state.assignments, [targetId]: seatId };
      let activePassengerId = state.activePassengerId;

      if (!oldSeat) {
        const targetIndex = state.passengers.findIndex((passenger) => passenger.id === targetId);
        const orderedPassengers = [
          ...state.passengers.slice(targetIndex + 1),
          ...state.passengers.slice(0, targetIndex),
        ];
        const nextPassenger = orderedPassengers.find(
          (passenger) => !assignments[passenger.id]
        );
        activePassengerId = nextPassenger ? nextPassenger.id : targetId;
      }

      return { ...state, assignments, activePassengerId };
    }

    case ACTIONS.REMOVE_SEAT: {
      const { passengerId } = action.payload;
      const targetId = passengerId || state.activePassengerId;
      if (!targetId || !state.assignments[targetId]) return state;
      const assignments = { ...state.assignments };
      delete assignments[targetId];
      return { ...state, assignments };
    }

    case ACTIONS.SET_LAYOUT: {
      const { layoutId } = action.payload;
      if (layoutId === state.layoutId) return state;
      return {
        ...state,
        layoutId,
        assignments: {},
      };
    }

    case ACTIONS.SET_MEAL: {
      const { passengerId, mealId } = action.payload;
      const targetId = passengerId || state.activePassengerId;
      if (!targetId || !state.passengers.some((p) => p.id === targetId)) return state;
      const meals = { ...state.meals, [targetId]: mealId };
      return { ...state, meals };
    }

    case ACTIONS.RESET: {
      return { ...INITIAL_STATE };
    }

    default:
      return state || INITIAL_STATE;
  }
}

/**
 * Calculate all seat and meal charges from the current assignments.
 */
export function calculateTotal(assignments, meals, layoutId) {
  const seatsById = new Map(
    buildSeatsForLayout(layoutId).map((seat) => [seat.id, seat])
  );
  const passengerIds = new Set([
    ...Object.keys(assignments),
    ...Object.entries(meals)
      .filter(([, mealId]) => mealId && mealId !== 'none')
      .map(([passengerId]) => passengerId),
  ]);
  const mealById = new Map(MEALS.map((meal) => [meal.id, meal]));
  const lineItems = [...passengerIds].map((passengerId) => {
    const assignedSeatId = assignments[passengerId];
    const seat = assignedSeatId ? seatsById.get(assignedSeatId) : null;
    const selectedMeal = mealById.get(meals[passengerId]);
    const meal = selectedMeal && selectedMeal.id !== 'none' ? selectedMeal : null;

    return {
      passengerId,
      seatId: seat ? seat.id : null,
      category: seat ? CATEGORY_LABELS[seat.category] : null,
      seatPrice: seat ? seat.price : 0,
      mealId: meal ? meal.id : null,
      meal: meal ? meal.label : 'None',
      mealPrice: meal ? meal.price : 0,
      subtotal: (seat ? seat.price : 0) + (meal ? meal.price : 0),
    };
  });
  const seatTotal = lineItems.reduce((total, item) => total + item.seatPrice, 0);
  const mealTotal = lineItems.reduce((total, item) => total + item.mealPrice, 0);

  return {
    seatTotal,
    mealTotal,
    grandTotal: seatTotal + mealTotal,
    lineItems,
  };
}

/**
 * Persistence keys for localStorage.
 */
export const STORAGE_KEY = 'flight-seat-selection-v1';

/**
 * Save the current booking state to localStorage.
 */
export function persistBooking(state) {
  try {
    const payload = {
      layoutId: state.layoutId,
      passengerCount: state.passengerCount,
      passengers: state.passengers,
      activePassengerId: state.activePassengerId,
      assignments: state.assignments,
      meals: state.meals,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // localStorage may be unavailable or quota-exceeded in private mode.
    // Silently ignore persistence failures.
  }
}

/**
 * Load a previously saved booking state from localStorage.
 * Returns null when nothing is stored or the data is invalid.
 */
export function loadBooking() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

/**
 * Clear persisted booking data.
 */
export function clearBooking() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore.
  }
}

/**
 * Validate the current booking before confirmation.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateBooking(state) {
  const errors = [];
  const { passengers, assignments, meals, layoutId } = state;

  // Every passenger must have at most one seat (already enforced by reducer).
  // Check for duplicate seats across passengers.
  const assignedSeats = Object.values(assignments);
  const duplicateSeats = assignedSeats.filter(
    (seatId, index) => assignedSeats.indexOf(seatId) !== index
  );
  if (duplicateSeats.length > 0) {
    errors.push(`Duplicate seat assignment detected: ${duplicateSeats.join(', ')}.`);
  }

  // All assigned seats must exist in the current layout.
  const validSeatIds = new Set(buildSeatsForLayout(layoutId).map((s) => s.id));
  for (const [passengerId, seatId] of Object.entries(assignments)) {
    if (!validSeatIds.has(seatId)) {
      const passenger = passengers.find((p) => p.id === passengerId);
      errors.push(
        `Seat ${seatId} assigned to ${passenger ? passenger.name : passengerId} is not valid in the current layout.`
      );
    }
  }

  // All meal selections must be valid.
  const validMealIds = new Set(MEALS.map((m) => m.id));
  for (const [passengerId, mealId] of Object.entries(meals)) {
    if (!validMealIds.has(mealId)) {
      const passenger = passengers.find((p) => p.id === passengerId);
      errors.push(
        `Invalid meal selection for ${passenger ? passenger.name : passengerId}.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
