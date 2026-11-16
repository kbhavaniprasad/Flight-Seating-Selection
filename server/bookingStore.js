import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { randomUUID } from 'node:crypto';

const databaseDirectory = path.dirname(fileURLToPath(import.meta.url));

export class BookingConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

function writeDatabase(databasePath, bytes) {
  if (databasePath === ':memory:') return;

  const temporaryPath = `${databasePath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, bytes);
    fs.renameSync(temporaryPath, databasePath);
  } catch (error) {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    throw error;
  }
}

function readRows(database, sql, parameters = []) {
  const statement = database.prepare(sql);
  try {
    statement.bind(parameters);
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    return rows;
  } finally {
    statement.free();
  }
}

export async function createBookingStore({
  databasePath = path.resolve(databaseDirectory, 'data', 'bookings.sqlite'),
} = {}) {
  const SQL = await initSqlJs({
    locateFile: (filename) =>
      path.resolve(process.cwd(), 'node_modules', 'sql.js', 'dist', filename),
  });

  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const existingDatabase =
    databasePath !== ':memory:' && fs.existsSync(databasePath)
      ? new Uint8Array(fs.readFileSync(databasePath))
      : undefined;
  let database = new SQL.Database(existingDatabase);
  const initializeSchema = (connection) => {
    connection.run('PRAGMA foreign_keys = ON');
    connection.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      layout_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS booking_passengers (
      booking_id TEXT NOT NULL,
      passenger_id TEXT NOT NULL,
      passenger_name TEXT NOT NULL,
      seat_id TEXT,
      meal_id TEXT NOT NULL,
      seat_price INTEGER NOT NULL,
      meal_price INTEGER NOT NULL,
      PRIMARY KEY (booking_id, passenger_id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );
    CREATE TABLE IF NOT EXISTS seat_reservations (
      layout_id TEXT NOT NULL,
      seat_id TEXT NOT NULL,
      booking_id TEXT NOT NULL,
      passenger_id TEXT NOT NULL,
      PRIMARY KEY (layout_id, seat_id),
      FOREIGN KEY (booking_id, passenger_id)
        REFERENCES booking_passengers(booking_id, passenger_id)
    );
  `);
  };
  initializeSchema(database);
  if (!existingDatabase) writeDatabase(databasePath, database.export());

  return {
    getBookedSeats(layoutId) {
      return readRows(
        database,
        'SELECT seat_id FROM seat_reservations WHERE layout_id = ? ORDER BY seat_id',
        [layoutId]
      ).map((row) => row.seat_id);
    },

    getBookings() {
      return readRows(
        database,
        `SELECT b.id, b.layout_id, b.created_at, p.passenger_id, p.passenger_name,
                p.seat_id, p.meal_id, p.seat_price, p.meal_price
         FROM bookings b
         JOIN booking_passengers p ON p.booking_id = b.id
         ORDER BY b.created_at, p.passenger_id`
      );
    },

    createBooking(layoutId, passengers) {
      const previousDatabase = database.export();
      const bookingId = randomUUID();
      const createdAt = new Date().toISOString();
      let transactionStarted = false;
      let committed = false;

      try {
        database.run('BEGIN IMMEDIATE');
        transactionStarted = true;
        database.run(
          'INSERT INTO bookings (id, layout_id, created_at) VALUES (?, ?, ?)',
          [bookingId, layoutId, createdAt]
        );

        for (const passenger of passengers) {
          database.run(
            `INSERT INTO booking_passengers
              (booking_id, passenger_id, passenger_name, seat_id, meal_id, seat_price, meal_price)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              bookingId,
              passenger.passengerId,
              passenger.passengerName,
              passenger.seatId,
              passenger.mealId,
              passenger.seatPrice,
              passenger.mealPrice,
            ]
          );
          if (passenger.seatId) {
            database.run(
              `INSERT INTO seat_reservations (layout_id, seat_id, booking_id, passenger_id)
               VALUES (?, ?, ?, ?)`,
              [layoutId, passenger.seatId, bookingId, passenger.passengerId]
            );
          }
        }

        database.run('COMMIT');
        transactionStarted = false;
        committed = true;
        writeDatabase(databasePath, database.export());
      } catch (error) {
        if (transactionStarted) database.run('ROLLBACK');
        if (committed) {
          database.close();
          database = new SQL.Database(previousDatabase);
          initializeSchema(database);
        }
        if (error.message.includes('UNIQUE constraint failed: seat_reservations')) {
          throw new BookingConflictError('One or more selected seats have just been booked.');
        }
        throw error;
      }

      return {
        bookingId,
        bookedSeatIds: passengers
          .map((passenger) => passenger.seatId)
          .filter(Boolean),
        createdAt,
      };
    },

    close() {
      database.close();
    },
  };
}
