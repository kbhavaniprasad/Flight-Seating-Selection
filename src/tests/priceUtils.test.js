import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../utils/bookingUtils';
import { buildSeatsForLayout, getSeatById } from '../data/seatLayouts';

describe('pricing utilities', () => {
  it('calculates the requested three-passenger seat total and line items', () => {
    const total = calculateTotal(
      { p1: '1A', p2: '1C', p3: '1E' },
      {},
      '3-2'
    );

    expect(total.seatTotal).toBe(600);
    expect(total.mealTotal).toBe(0);
    expect(total.grandTotal).toBe(600);
    expect(total.lineItems).toEqual([
      expect.objectContaining({ passengerId: 'p1', seatId: '1A', category: 'Standard', seatPrice: 0 }),
      expect.objectContaining({ passengerId: 'p2', seatId: '1C', category: 'Extra Large', seatPrice: 350 }),
      expect.objectContaining({ passengerId: 'p3', seatId: '1E', category: 'Premium', seatPrice: 250 }),
    ]);
  });

  it('includes paid meals with and without a seat', () => {
    const total = calculateTotal(
      { p1: '1C' },
      { p1: 'vegan', p2: 'chefs-special' },
      '3-2'
    );

    expect(total.seatTotal).toBe(350);
    expect(total.mealTotal).toBe(450);
    expect(total.grandTotal).toBe(800);
  });

  it('recalculates immediately after replacing or removing a seat', () => {
    expect(calculateTotal({ p1: '1C' }, {}, '3-2').grandTotal).toBe(350);
    expect(calculateTotal({ p1: '1E' }, {}, '3-2').grandTotal).toBe(250);
    expect(calculateTotal({}, {}, '3-2').grandTotal).toBe(0);
  });

  it('returns zero totals when nothing is selected', () => {
    expect(calculateTotal({}, {}, '3-2')).toEqual({
      seatTotal: 0,
      mealTotal: 0,
      grandTotal: 0,
      lineItems: [],
    });
  });

  it('buildSeatsForLayout renders all configured columns with required sample prices', () => {
    const threeTwoSeats = buildSeatsForLayout('3-2');
    const twoThreeTwoSeats = buildSeatsForLayout('2-3-2');
    const seat = (seats, id) => seats.find((candidate) => candidate.id === id);

    expect(threeTwoSeats).toHaveLength(75);
    expect(seat(threeTwoSeats, '1A').price).toBe(0);
    expect(seat(threeTwoSeats, '1B').price).toBe(0);
    expect(seat(threeTwoSeats, '1C').price).toBe(350);
    expect(seat(threeTwoSeats, '1D').price).toBe(0);
    expect(seat(threeTwoSeats, '1E').price).toBe(250);
    expect(seat(threeTwoSeats, '2A').price).toBe(350);
    expect(seat(threeTwoSeats, '2B').price).toBe(0);
    expect(seat(twoThreeTwoSeats, '1E').price).toBe(250);
    expect(seat(twoThreeTwoSeats, '2A').price).toBe(350);
    expect(getSeatById('3-2', '1C').price).toBe(350);
    expect(getSeatById('3-2', '1C').occupied).toBe(false);
  });

  it('reduces standard seats while increasing premium and extra-large inventory', () => {
    const counts = (layoutId) =>
      buildSeatsForLayout(layoutId).reduce(
        (totals, seat) => {
          totals[seat.category] += 1;
          return totals;
        },
        { standard: 0, premium: 0, extraLegroom: 0 }
      );
    const threeTwo = counts('3-2');
    const twoThreeTwo = counts('2-3-2');

    expect(threeTwo).toEqual({ standard: 48, premium: 16, extraLegroom: 11 });
    expect(twoThreeTwo).toEqual({ standard: 69, premium: 22, extraLegroom: 14 });
    expect(buildSeatsForLayout('3-2')).toHaveLength(75);
    expect(buildSeatsForLayout('2-3-2')).toHaveLength(105);
  });
});
