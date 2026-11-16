import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEALS } from '../src/data/meals.js';
import {
  buildSeatsForLayout,
  LAYOUTS,
} from '../src/data/seatLayouts.js';
import { BookingConflictError } from './bookingStore.js';

const projectDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

class RequestError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function validateBooking(body) {
  if (!body || !LAYOUTS.some((layout) => layout.id === body.layoutId)) {
    throw new RequestError('Choose a valid seat layout.');
  }
  if (!Array.isArray(body.passengers) || body.passengers.length < 1 || body.passengers.length > 9) {
    throw new RequestError('A booking must include between 1 and 9 passengers.');
  }

  const seats = new Map(
    buildSeatsForLayout(body.layoutId).map((seat) => [seat.id, seat])
  );
  const passengerIds = new Set();
  const seatIds = new Set();
  const passengers = body.passengers.map((passenger) => {
    if (
      !passenger ||
      typeof passenger.passengerId !== 'string' ||
      !/^p[1-9]\d*$/.test(passenger.passengerId) ||
      passengerIds.has(passenger.passengerId)
    ) {
      throw new RequestError('Passenger information is invalid.');
    }
    passengerIds.add(passenger.passengerId);

    const passengerName =
      typeof passenger.passengerName === 'string' ? passenger.passengerName.trim() : '';
    if (!passengerName || passengerName.length > 80) {
      throw new RequestError('Each passenger needs a name of at most 80 characters.');
    }

    const mealId = passenger.mealId || 'none';
    const meal = MEALS.find((option) => option.id === mealId);
    if (!meal) throw new RequestError('A selected meal is not available.');

    let seat = null;
    if (passenger.seatId !== null && passenger.seatId !== undefined) {
      if (typeof passenger.seatId !== 'string' || !seats.has(passenger.seatId)) {
        throw new RequestError('A selected seat does not exist in this layout.');
      }
      seat = seats.get(passenger.seatId);
      if (seat.occupied) {
        throw new RequestError(`Seat ${seat.id} is occupied. Choose another seat.`, 409);
      }
      if (seatIds.has(seat.id)) {
        throw new RequestError(`Seat ${seat.id} is selected more than once.`);
      }
      seatIds.add(seat.id);
    }

    return {
      passengerId: passenger.passengerId,
      passengerName,
      seatId: seat ? seat.id : null,
      mealId: meal.id,
      seatPrice: seat ? seat.price : 0,
      mealPrice: meal.price,
    };
  });

  if (seatIds.size === 0) {
    throw new RequestError('Select at least one seat before confirming your booking.');
  }

  return { layoutId: body.layoutId, passengers };
}

export function createApp({ store, serveClient = false } = {}) {
  if (!store) throw new Error('A booking store is required.');

  const app = express();
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/seats', (request, response, next) => {
    const { layoutId } = request.query;
    if (!LAYOUTS.some((layout) => layout.id === layoutId)) {
      response.status(400).json({ error: 'Choose a valid seat layout.' });
      return;
    }
    try {
      response.json({ layoutId, bookedSeatIds: store.getBookedSeats(layoutId) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/bookings', (request, response, next) => {
    try {
      const { layoutId, passengers } = validateBooking(request.body);
      const booking = store.createBooking(layoutId, passengers);
      response.status(201).json({
        ...booking,
        bookedSeatIds: store.getBookedSeats(layoutId),
      });
    } catch (error) {
      if (error instanceof RequestError || error instanceof BookingConflictError) {
        response.status(error.statusCode || 409).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'API route not found.' });
  });

  if (serveClient) {
    const clientDirectory = path.join(projectDirectory, 'dist');
    app.use(express.static(clientDirectory));
    app.get(/.*/, (_request, response) => {
      response.sendFile(path.join(clientDirectory, 'index.html'));
    });
  }

  app.use((error, _request, response, _next) => {
    if (error.type === 'entity.parse.failed') {
      response.status(400).json({ error: 'Request body must be valid JSON.' });
      return;
    }
    console.error('API request failed:', error);
    response.status(500).json({ error: 'The request could not be completed. Please try again.' });
  });

  return app;
}
