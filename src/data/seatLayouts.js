/**
 * Aircraft seat layout configuration.
 *
 * Each layout defines column groups. A group is either a set of seat columns
 * or an aisle marker ({ type: 'aisle' }). Seat columns have a letter and a
 * pricing category (standard | premium | extraLegroom).
 *
 * The renderer iterates groups generically, so no layout-specific JSX is hardcoded.
 */

export const SEAT_CATEGORIES = {
  STANDARD: 'standard',
  PREMIUM: 'premium',
  EXTRA_LEGROOM: 'extraLegroom',
};

export const CATEGORY_PRICES = {
  [SEAT_CATEGORIES.STANDARD]: 0,
  [SEAT_CATEGORIES.PREMIUM]: 250,
  [SEAT_CATEGORIES.EXTRA_LEGROOM]: 350,
};

export const CATEGORY_LABELS = {
  [SEAT_CATEGORIES.STANDARD]: 'Standard',
  [SEAT_CATEGORIES.PREMIUM]: 'Premium',
  [SEAT_CATEGORIES.EXTRA_LEGROOM]: 'Extra Large',
};

export const CATEGORY_CONFIG = {
  [SEAT_CATEGORIES.STANDARD]: {
    label: 'Standard',
    price: 0,
    color: 'green',
    badge: 'bg-green-50 border-green-200 text-green-700',
    seatBg: 'bg-green-50 border-green-200 text-green-700',
    dot: 'bg-green-500',
    description: 'Comfortable standard seating',
  },
  [SEAT_CATEGORIES.PREMIUM]: {
    label: 'Premium',
    price: 250,
    color: 'amber',
    badge: 'bg-amber-50 border-amber-200 text-amber-800',
    seatBg: 'bg-amber-50 border-amber-200 text-amber-800',
    dot: 'bg-amber-500',
    description: 'Preferred location with extra comfort',
  },
  [SEAT_CATEGORIES.EXTRA_LEGROOM]: {
    label: 'Extra Legroom',
    price: 350,
    color: 'purple',
    badge: 'bg-purple-50 border-purple-200 text-purple-800',
    seatBg: 'bg-purple-50 border-purple-200 text-purple-800',
    dot: 'bg-purple-500',
    description: 'Additional legroom for added comfort',
  },
};

export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG[SEAT_CATEGORIES.STANDARD];
}

const ROW_COUNT = 15;

const PREMIUM_SEATS = {
  '3-2': new Set([
    '1E', '2E', '3A', '3E', '4C', '5D', '6C', '7A',
    '8D', '9B', '10E', '11A', '12D', '13E', '14B', '15D',
  ]),
  '2-3-2': new Set([
    '1D', '1E', '2G', '3A', '3G', '4C', '4F', '5A',
    '6A', '6D', '7F', '8B', '8D', '9C', '10F', '11A',
    '11G', '12E', '13G', '14C', '15D', '15F',
  ]),
};

const EXTRA_LARGE_SEATS = {
  '3-2': new Set([
    '1C', '2A', '4A', '5B', '6E', '8C',
    '9D', '11E', '12B', '13A', '15C',
  ]),
  '2-3-2': new Set([
    '2A', '2C', '3B', '4G', '5E', '6F', '8G',
    '9A', '10C', '11D', '12G', '13B', '14E', '15A',
  ]),
};

/**
 * Base seat template: row numbers 1..15 with mixed pricing categories and
 * pre-occupied seats. Occupied flags are applied on top of this template per
 * layout (see OCCUPIED_SEATS below).
 */
const baseSeatsByLayout = {
  '3-2': [
    { row: 1, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 1, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 1, letter: 'C', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
    { row: 2, letter: 'A', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
    { row: 2, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 2, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 3, letter: 'A', category: SEAT_CATEGORIES.PREMIUM },
    { row: 3, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 3, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'C', category: SEAT_CATEGORIES.PREMIUM },
    { row: 5, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 5, letter: 'B', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
    { row: 5, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'C', category: SEAT_CATEGORIES.PREMIUM },
    { row: 7, letter: 'A', category: SEAT_CATEGORIES.PREMIUM },
    { row: 7, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 7, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'C', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
    { row: 9, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 9, letter: 'B', category: SEAT_CATEGORIES.PREMIUM },
    { row: 9, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'A', category: SEAT_CATEGORIES.PREMIUM },
    { row: 11, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 12, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 12, letter: 'B', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
    { row: 12, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'B', category: SEAT_CATEGORIES.PREMIUM },
    { row: 14, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'C', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
  ],
  '2-3-2': [
    { row: 1, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 1, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 1, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 1, letter: 'D', category: SEAT_CATEGORIES.PREMIUM },
    { row: 1, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 1, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 1, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 2, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 2, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 2, letter: 'C', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
    { row: 2, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 2, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 2, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 2, letter: 'G', category: SEAT_CATEGORIES.PREMIUM },
    { row: 3, letter: 'A', category: SEAT_CATEGORIES.PREMIUM },
    { row: 3, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 3, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 3, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 3, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 3, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 3, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'C', category: SEAT_CATEGORIES.PREMIUM },
    { row: 4, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 4, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 5, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 5, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 5, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 5, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 5, letter: 'E', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
    { row: 5, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 5, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'D', category: SEAT_CATEGORIES.PREMIUM },
    { row: 6, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 6, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 7, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 7, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 7, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 7, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 7, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 7, letter: 'F', category: SEAT_CATEGORIES.PREMIUM },
    { row: 7, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 8, letter: 'G', category: SEAT_CATEGORIES.EXTRA_LEGROOM },
    { row: 9, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 9, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 9, letter: 'C', category: SEAT_CATEGORIES.PREMIUM },
    { row: 9, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 9, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 9, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 9, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 10, letter: 'F', category: SEAT_CATEGORIES.PREMIUM },
    { row: 10, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 11, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 12, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 12, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 12, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 12, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 12, letter: 'E', category: SEAT_CATEGORIES.PREMIUM },
    { row: 12, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 12, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 13, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 14, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { row: 15, letter: 'G', category: SEAT_CATEGORIES.STANDARD },
  ],
};

/**
 * Pre-occupied seats per layout (seatId -> true). Sample seats from spec:
 * 1A ₹0, 1B ₹0, 1C Extra Legroom ₹350, 1D ₹0, 1E Premium ₹250, 2A Extra
 * Legroom ₹350, 2B ₹0 are present in the base templates above.
 */
export const OCCUPIED_SEATS = {
  '3-2': new Set(['3A', '5B', '8C', '12B', '14B']),
  '2-3-2': new Set(['1D', '2C', '5E', '7D', '9C', '12E']),
};

/**
 * Column groups per layout. Each entry is either { type: 'aisle' } or a seat
 * column object { letter, category }. The renderer maps over this generically.
 * For rendering we expand seats into per-row groups separated by aisles.
 */
export const COLUMN_GROUPS = {
  '3-2': [
    { letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { type: 'aisle' },
    { letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { letter: 'E', category: SEAT_CATEGORIES.STANDARD },
  ],
  '2-3-2': [
    { letter: 'A', category: SEAT_CATEGORIES.STANDARD },
    { letter: 'B', category: SEAT_CATEGORIES.STANDARD },
    { type: 'aisle' },
    { letter: 'C', category: SEAT_CATEGORIES.STANDARD },
    { letter: 'D', category: SEAT_CATEGORIES.STANDARD },
    { letter: 'E', category: SEAT_CATEGORIES.STANDARD },
    { type: 'aisle' },
    { letter: 'F', category: SEAT_CATEGORIES.STANDARD },
    { letter: 'G', category: SEAT_CATEGORIES.STANDARD },
  ],
};

export const LAYOUTS = [
  { id: '3-2', name: '3-2 Configuration', label: 'A B C │ D E', cols: 5 },
  { id: '2-3-2', name: '2-3-2 Configuration', label: 'A B │ C D E │ F G', cols: 7 },
];

export const DEFAULT_LAYOUT_ID = '3-2';

/**
 * Build the full seat list for a layout: rows 1..15 with every column letter
 * defined for that layout, merged with category info and occupied flag.
 */
export function buildSeatsForLayout(layoutId) {
  const occupied = OCCUPIED_SEATS[layoutId] || new Set();
  const columns = (COLUMN_GROUPS[layoutId] || []).filter((group) => group.type !== 'aisle');
  const baseSeats = new Map(
    (baseSeatsByLayout[layoutId] || []).map((seat) => [`${seat.row}${seat.letter}`, seat])
  );
  const premiumSeats = PREMIUM_SEATS[layoutId] || new Set();
  const extraLargeSeats = EXTRA_LARGE_SEATS[layoutId] || new Set();

  return Array.from({ length: ROW_COUNT }, (_, index) => index + 1).flatMap((row) =>
    columns.map((column) => {
      const id = `${row}${column.letter}`;
      const category =
        extraLargeSeats.has(id)
          ? SEAT_CATEGORIES.EXTRA_LEGROOM
          : premiumSeats.has(id)
            ? SEAT_CATEGORIES.PREMIUM
            : baseSeats.get(id)?.category || SEAT_CATEGORIES.STANDARD;
      return {
        id,
        row,
        letter: column.letter,
        category,
        price: CATEGORY_PRICES[category],
        occupied: occupied.has(id),
      };
    })
  );
}

export function getSeatById(layoutId, seatId) {
  return buildSeatsForLayout(layoutId).find((seat) => seat.id === seatId);
}

export function seatLabel(seat) {
  return `${seat.row}${seat.letter}`;
}

export function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
