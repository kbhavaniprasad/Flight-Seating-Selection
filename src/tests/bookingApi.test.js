import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../../server/app';
import { createBookingStore } from '../../server/bookingStore';

describe('booking API persistence', () => {
  let databasePath;
  let temporaryDirectory;
  let server;
  let store;
  let baseUrl;

  beforeAll(async () => {
    temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'flight-booking-'));
    databasePath = path.join(temporaryDirectory, 'bookings.sqlite');
    store = await createBookingStore({ databasePath });
    server = createApp({ store }).listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (store) store.close();
    if (temporaryDirectory) {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it('reserves seats atomically and keeps them unavailable after reopening the database', async () => {
    const emptyAvailability = await fetch(`${baseUrl}/api/seats?layoutId=3-2`);
    expect(await emptyAvailability.json()).toEqual({
      layoutId: '3-2',
      bookedSeatIds: [],
    });

    const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layoutId: '3-2',
        passengers: [
          {
            passengerId: 'p1',
            passengerName: 'Alex Passenger',
            seatId: '1A',
            mealId: 'vegan',
          },
        ],
      }),
    });
    expect(bookingResponse.status).toBe(201);
    expect(await bookingResponse.json()).toMatchObject({
      bookedSeatIds: ['1A'],
    });

    const duplicateResponse = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layoutId: '3-2',
        passengers: [
          {
            passengerId: 'p1',
            passengerName: 'Another Passenger',
            seatId: '1A',
            mealId: 'none',
          },
        ],
      }),
    });
    expect(duplicateResponse.status).toBe(409);

    const secondBookingResponse = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layoutId: '3-2',
        passengers: [
          {
            passengerId: 'p1',
            passengerName: 'Second Passenger',
            seatId: '1B',
            mealId: 'none',
          },
        ],
      }),
    });
    expect(secondBookingResponse.status).toBe(201);
    expect((await secondBookingResponse.json()).bookedSeatIds).toEqual(['1A', '1B']);

    await new Promise((resolve) => server.close(resolve));
    store.close();
    store = await createBookingStore({ databasePath });
    server = createApp({ store }).listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const persistedAvailability = await fetch(`${baseUrl}/api/seats?layoutId=3-2`);
    expect(await persistedAvailability.json()).toEqual({
      layoutId: '3-2',
      bookedSeatIds: ['1A', '1B'],
    });
    expect(store.getBookings()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        passenger_name: 'Alex Passenger',
        seat_id: '1A',
        meal_id: 'vegan',
        seat_price: 0,
        meal_price: 150,
      }),
      expect.objectContaining({
        passenger_name: 'Second Passenger',
        seat_id: '1B',
      }),
    ]));
  });
});
