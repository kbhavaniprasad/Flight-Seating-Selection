import { createApp } from './app.js';
import { createBookingStore } from './bookingStore.js';

const store = await createBookingStore({
  databasePath: process.env.DATABASE_PATH,
});
const app = createApp({
  store,
  serveClient: process.env.NODE_ENV === 'production',
});
const port = Number(
  process.env.API_PORT ||
    process.env.PORT ||
    (process.env.NODE_ENV === 'production' ? 3000 : 3001)
);

const server = app.listen(port, () => {
  console.log(`Flight booking API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
