import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { BookingConfirmation } from '../components/BookingConfirmation';
import { ConfirmSeatsButton } from '../components/PricingSummary';
import { Seat } from '../components/Seat';
import { SeatRow } from '../components/SeatRow';

describe('App', () => {
  it('renders within the booking provider', () => {
    const markup = renderToStaticMarkup(React.createElement(App));
    expect(markup).toContain('animate-pulse');
    expect(markup).toContain('Select the Number of Passengers');
    expect(markup).toContain('Continue to seat selection');
  });

  it('renders seat buttons in a seat row', () => {
    const markup = renderToStaticMarkup(
      React.createElement(SeatRow, {
        row: 1,
        seats: [{ id: '1A', row: 1, letter: 'A', category: 'standard', price: 0 }],
        state: { assignments: {} },
        seatToPassenger: {},
        activePassengerId: 'p1',
        onSeatClick: () => {},
      })
    );
    expect(markup).toContain('Seat 1A');
  });

  it('forwards the mouse event to the seat hover handler', () => {
    const onMouseEnter = vi.fn();
    const seatElement = Seat.type({
      seat: { id: '1A', row: 1, letter: 'A', category: 'standard', price: 0 },
      isSelectedByActive: false,
      isSelectedByOther: false,
      isOccupied: false,
      isBooked: false,
      onMouseEnter,
    });
    const event = { stopPropagation: vi.fn(), currentTarget: {} };

    seatElement.props.onMouseEnter(event);

    expect(onMouseEnter).toHaveBeenCalledWith(event);
  });

  it('keeps seats held by another passenger clickable for conflict feedback', () => {
    const markup = renderToStaticMarkup(
      React.createElement(SeatRow, {
        row: 1,
        seats: [{ id: '1A', row: 1, letter: 'A', category: 'standard', price: 0 }],
        state: { assignments: { p1: '1A' } },
        seatToPassenger: { '1A': 'p1' },
        activePassengerId: 'p2',
        onSeatClick: () => {},
      })
    );

    expect(markup).toContain('aria-disabled="true"');
    expect(markup).not.toContain('disabled=""');
  });

  it('renders database-booked seats as unavailable', () => {
    const markup = renderToStaticMarkup(
      React.createElement(SeatRow, {
        row: 1,
        seats: [{ id: '1A', row: 1, letter: 'A', category: 'standard', price: 0 }],
        state: { assignments: {} },
        seatToPassenger: {},
        bookedSeatIds: ['1A'],
        activePassengerId: 'p1',
        onSeatClick: () => {},
      })
    );

    expect(markup).toContain('Seat 1A, Standard');
    expect(markup).toContain('already booked');
    expect(markup).toContain('aria-disabled="true"');
  });

  it('disables confirmation until a seat is selected', () => {
    const disabledMarkup = renderToStaticMarkup(
      React.createElement(ConfirmSeatsButton, {
        seatCount: 0,
        total: 0,
        onClick: () => {},
      })
    );
    const enabledMarkup = renderToStaticMarkup(
      React.createElement(ConfirmSeatsButton, {
        seatCount: 1,
        total: 350,
        onClick: () => {},
      })
    );

    expect(disabledMarkup).toContain('disabled=""');
    expect(enabledMarkup).toContain('Confirm 1 seat · ₹350');
    expect(enabledMarkup).not.toContain('disabled=""');
  });

  it('shows a missing-seat warning and disables confirm in review', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BookingConfirmation, {
        mode: 'review',
        passengers: [{ id: 'p1', name: 'Passenger 1' }, { id: 'p2', name: 'Passenger 2' }],
        assignments: { p1: '1C' },
        pricing: {
          grandTotal: 350,
          lineItems: [{
            passengerId: 'p1',
            seatId: '1C',
            category: 'Extra Legroom',
            seatPrice: 350,
            meal: 'None',
            mealPrice: 0,
            subtotal: 350,
          }],
        },
        onEdit: () => {},
        onConfirm: () => {},
        onStartOver: () => {},
      })
    );

    expect(markup).toContain('1 passenger has no seat assigned.');
    expect(markup).toContain('Grand total');
    expect(markup).toContain('disabled');
  });

  it('shows the success summary and start-over action after confirmation', () => {
    const markup = renderToStaticMarkup(
      React.createElement(BookingConfirmation, {
        mode: 'success',
        passengers: [{ id: 'p1', name: 'Passenger 1' }],
        assignments: { p1: '1C' },
        pricing: {
          grandTotal: 350,
          lineItems: [{
            passengerId: 'p1',
            seatId: '1C',
            category: 'Extra Legroom',
            seatPrice: 350,
            meal: 'None',
            mealPrice: 0,
            subtotal: 350,
          }],
        },
        onEdit: () => {},
        onConfirm: () => {},
        onStartOver: () => {},
      })
    );

    expect(markup).toContain('Booking confirmed!');
    expect(markup).toContain('Start over');
    expect(markup).toContain('₹350');
  });
});
