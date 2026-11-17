# Flight Seat Selection & Passenger Management

A React (Vite) flight seat-selection application with an Express API and SQLite-backed confirmed bookings.

## Live Demo / Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the API and Vite development server
npm run dev

# 3. Run unit tests
npm test

# 4. Build for production
npm run build
```

The app opens at `http://localhost:5173`; Vite proxies `/api` requests to the local API.
Confirmed bookings are stored in `server/data/bookings.sqlite`. Set `DATABASE_PATH` to use a
different persistent location.

---

## Features

### Core
- **Passenger selection**: choose 1–9 passengers; editable names; switch active passenger anytime.
- **Initial user selection**: choose the passenger count in the opening dialog before entering the booking flow.
- **One seat per passenger**: a seat can never be assigned to more than one passenger.
- **Aircraft seat map**: switchable 3–2 and 2–3–2 layouts defined via configuration data (column groups), rendered generically with 15 complete rows.
- **Professional seat map**: centered map with consistent seat dimensions (44×44px touch targets), clear aisle separation, row numbering, category badges (S/P/E) on every seat, and floating hover tooltips with seat details.
- **Seat states**: Available / Your Seat / Taken by Another / Occupied (blocked) — each visually distinct with color, icons, and labels (not color alone).
- **Pricing categories**: Standard ₹0 (green), Premium ₹250 (amber), Extra Legroom ₹350 (purple), shown via seat badges, tooltips, and the itemized summary.
- **Pre-occupied seats**: realistic mix per layout, including the spec sample seats (1A ₹0, 1B ₹0, 1C Extra Legroom ₹350, 1D ₹0, 1E Premium ₹250, 2A Extra Legroom ₹350, 2B ₹0).
- **Seat assignment**: click to assign/replace/remove; newly assigned passengers auto-advance to the next unassigned passenger. Conflicts show a toast message.
- **Booking confirmation**: Confirm button is disabled until every passenger has a seat. Opens an itemized review modal. Confirmed details are persisted to SQLite via the Express API; already booked seats remain unavailable after reload.
- **Meal selection**: one meal per passenger via selectable cards (free and paid options).
- **Live pricing**: itemized summary and grand total derived from state, formatted as ₹ with Indian number formatting.

### Booking workflow
- **Booking progress indicator**: 5-step progress bar (Select Passengers → Choose Seats → Select Meals → Review Booking → Confirm).
- **Booking validation**: validates no duplicate seats, all passengers have seats, valid meal selections, and seat availability in the current layout before confirmation.
- **Booking confirmation screen**: professional modal with passenger details, seats, meals, and grand total; success state shows confirmed booking summary.
- **Reset & modify**: reset all selections, change seats/meals per passenger, start over after confirmation.

### UI/UX
- **Professional two-column desktop layout**: aircraft seat map (~65-70% width) on the left, passenger booking panel (~30-35% width) on the right with sticky positioning.
- **Compact, balanced spacing**: reduced unnecessary margins/padding; seat map expanded to utilize screen width efficiently.
- **Card-based design**: Tailwind CSS, professional airline blue primary color, consistent border radius, subtle shadows.
- **Responsive**: desktop two-column layout; tablet optimised widths; mobile stacked layout with horizontal scroll-safe seat map and sticky bottom total bar.
- **Loading state**: seat availability fetched from the API with skeleton loaders.
- **Empty state**: no passengers yet.
- **Error state**: clear error message with Retry button; simulates API failure for testing.
- **Toasts/inline feedback**: aria-live notifications for invalid actions, confirmations, and warnings.
- **Accessibility**: semantic HTML, aria-labels, aria-disabled, keyboard navigation, visible focus states, color + icons/labels (no color-only meaning).
- **Data persistence**: `localStorage` preserves in-progress selections across page refreshes; confirmed bookings persisted to SQLite via the Express API.
- **Subtle transitions/animations**: fade-in, pulse on active selection, smooth hover states.

---

## Folder Structure

```
flight-seat-selection/
├── index.html
├── package.json
├── .gitignore
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
├── server/
│   ├── app.js
│   ├── bookingStore.js
│   └── index.js
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── components/
    │   ├── Seat.jsx
    │   ├── SeatRow.jsx
    │   ├── SeatMap.jsx
    │   ├── SeatLegend.jsx
    │   ├── LayoutToggle.jsx
    │   ├── PassengerCountSelector.jsx
    │   ├── PassengerList.jsx
    │   ├── PassengerCard.jsx
    │   ├── MealSelector.jsx
    │   ├── PricingSummary.jsx
    │   ├── BookingConfirmation.jsx
    │   ├── BookingProgressIndicator.jsx
    │   ├── SeatTooltip.jsx
    │   ├── Skeleton.jsx
    │   ├── ErrorState.jsx
    │   └── EmptyState.jsx
    ├── context/
    │   ├── BookingContext.jsx
    │   └── bookingReducer.js
    ├── hooks/
    │   └── useBookings.js
    ├── data/
    │   ├── seatLayouts.js
    │   └── meals.js
    ├── utils/
    │   ├── bookingUtils.js
    │   └── (pricing lives in bookingUtils)
    └── tests/
        ├── bookingReducer.test.js
        ├── bookingApi.test.js
        ├── priceUtils.test.js
        └── App.test.jsx
```

---

## State Management Approach

Single source of truth via **useReducer + Context** (`BookingContext`).

State shape:

```js
{
  layoutId: '3-2' | '2-3-2',
  passengerCount: 1..9,
  passengers: [{ id: 'p1', name: 'Passenger 1' }, ...],
  activePassengerId: 'p1' | null,
  assignments: { passengerId: seatId },   // e.g. { p1: '1A', p2: '3C' }
  meals: { passengerId: mealId }          // e.g. { p1: 'vegan' }
}
```

Derived (with `useMemo`, not stored):
- `pricing`: derived `{ seatTotal, mealTotal, grandTotal, lineItems }`, calculated by `calculateTotal(assignments, meals, layoutId)`.
- `seatToPassenger`: seat ID → passenger ID lookup used to reject conflicts and render held seats.

### Reducer Actions (pure)

| Action | Payload | Effect |
|--------|---------|--------|
| `SET_PASSENGER_COUNT` | `{ count }` | Add/remove passengers; releases seats/meals of removed passengers; clamps 1–9; falls back active passenger if removed. |
| `SET_ACTIVE_PASSENGER` | `{ passengerId }` | Changes the active passenger. |
| `SET_PASSENGER_NAME` | `{ passengerId, name }` | Persists a trimmed passenger name. |
| `ASSIGN_SEAT` | `{ seatId, passengerId? }` | Assigns seat to active (or given) passenger; replaces an existing seat, then advances to the next unassigned passenger. Blocked if occupied or held by another. |
| `REMOVE_SEAT` | `{ passengerId? }` | Unassigns the active (or given) passenger's seat. |
| `SET_LAYOUT` | `{ layoutId }` | Switches layout and clears temporary seat selections; meal selections are preserved. |
| `SET_MEAL` | `{ passengerId, mealId }` | Sets/clears a meal for a passenger. |
| `RESET` | `{}` | Resets to initial state. |

### Seat Assignment Logic

1. **Active passenger required**: if none is active, a warning toast is shown.
2. **Conflict prevention**: before assigning, `canAssignSeat` checks:
   - seat is not pre-occupied;
   - seat is not held by another passenger (via `seatToPassenger` derivation);
   - if already assigned to the active passenger, it's treated as removal.
3. **One seat per passenger**: assigning a new seat overwrites the passenger's previous seat, freeing the old seat immediately.
4. **Occupied / taken seats**: cannot be assigned; the seat button remains actionable so an explanatory toast can be shown.
5. **Reducer validation**: assignment actions also reject occupied seats and seat IDs that do not exist in the active layout, even if they bypass the UI.
6. **Layout switching**: if temporary seats are assigned, the UI asks for confirmation before clearing them. Confirmed reservations remain stored against their original layout.
7. **Confirmed seat reservations**: `GET /api/seats` reads reserved seat IDs from SQLite. `POST /api/bookings` validates the layout, seats, and meals, then saves bookings and passenger records. A unique `(layout_id, seat_id)` key rejects duplicate reservations.

### How Totals Are Derived

Totals are **not stored**. The pure `calculateTotal` helper looks up seat data from the active layout and meal data from the mock menu:

```
subtotal(p) = seatPrice(seatId[p]) + mealPrice(mealId[p])
grandTotal  = seatTotal + mealTotal
```

Currency uses `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` for Indian ₹ formatting.

---

## Assumptions

- Seat count: 15 rows per layout (3–2 has A,B,C + D,E; 2–3–2 has A,B + C,D,E + F,G).
- Layout switch asks for confirmation when temporary seats are assigned, then clears those selections and preserves meal choices.
- Passenger count reduced below assigned passengers releases those seats/meals automatically.
- Seat layouts and preoccupied seats remain local mock data; confirmed bookings are persisted in the SQLite database managed by the Express API.
- Run one API process against a durable filesystem. For multi-instance production deployments, point the API at a shared transactional database rather than a per-instance SQLite file.
- "Simulate error" button toggles a forced failure state to demonstrate the error + Retry path.

---

## Bonus Features Implemented

- Meal selection per passenger (free + paid options) included in summary & grand total.
- Loading / error / empty states with Retry.
- Toast notification system with aria-live.
- Accessibility (aria-labels, keyboard navigation, focus states).
- Responsive mobile layout with a fixed, live-updating total bar.

---

## Production run

Build the client and start the Express server with `npm run build` followed by `npm start`.
The server serves both the built frontend and API. Set `PORT` and `DATABASE_PATH` in the
deployment environment, and mount a persistent volume for the SQLite file. Static-only hosting
(such as GitHub Pages) cannot preserve bookings or serve the API.

When hosting the frontend separately, the API allows the production Vercel origin
`https://flight-seating-selection.vercel.app`. Set `FRONTEND_ORIGINS` to a comma-separated list
of exact frontend origins if using a different Vercel domain or a custom domain.

### Vercel + Render deployment

- In Vercel, set `API_BASE_URL` to the Render service origin, for example
  `https://flight-seating-selection.onrender.com` (no trailing slash). Set it for every deployed
  environment. Vite embeds this value at build time, so redeploy the frontend after changing it.
  If unset, the production build uses this same default. `VITE_API_BASE_URL` is also supported.
- In Render, set `FRONTEND_ORIGINS` to the exact Vercel deployment origin(s), comma-separated.
  The default allowlist contains `https://flight-seating-selection.vercel.app`.
- Render supplies `PORT`; optionally set `DATABASE_PATH` and attach persistent storage for SQLite.
- The current `/api/payments` handler is a development mock, not a payment gateway. It returns
  HTTP 503 in production so a mock response cannot confirm a real booking. Production payments
  require implementing a provider-backed create/verify flow and configuring its credentials as
  Render secrets. This repository currently has no payment credentials or provider integration.

After setting variables, deploy the Render service and then rebuild/redeploy the Vercel frontend.
Verify `GET https://<render-origin>/api/seats?layoutId=3-2` and send an `OPTIONS` request to
`/api/payments` with an allowed Vercel `Origin` to confirm service health and CORS. The production
payment POST returns the explicit 503 until a real provider is configured.

---

## Design Decisions & Future Improvements

### Design decisions
- **Configuration-driven layouts**: layouts are pure data (column groups + seat templates), so the renderer is generic and adding a new layout (e.g. 3–4–3) requires no new components.
- **SQLite-backed reservations**: the API owns confirmed seat availability; browser state is only used for the in-progress selection.
- **useReducer + Context**: keeps business rules in pure, testable functions; no external state library needed.
- **Derived totals**: avoids stale cached totals and guarantees consistency.
- **Toast bus**: simple pub/sub so any component can surface feedback without prop drilling.
- **React.memo on Seat**: seat map re-renders frequently on hover; memoizing Seat avoids unnecessary re-renders.

### Future improvements
- Integrate a real payment and airline booking service.
- Seat maps for wide-body aircraft (3–4–3, 3–3–3).
- Passenger details (age, frequent flyer number) per passenger.
- Real-time multi-user seat availability (WebSockets/backend).
- More granular accessibility testing (screen reader verification).
- Unit/integration tests with React Testing Library for components.
