import { useState } from 'react';

/**
 * Initial passenger-selection popup (Step 1 of the booking workflow).
 */
export function UserSelectionDialog({ count, onCountChange, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-selection-title"
        className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl"
      >
        <h2 id="user-selection-title" className="text-xl font-bold text-gray-900">
          Select the Number of Passengers
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Choose how many passengers you are booking for.
        </p>
        <label
          htmlFor="initial-passenger-count"
          className="mt-5 block text-sm font-medium text-gray-700"
        >
          Number of passengers
        </label>
        <select
          id="initial-passenger-count"
          value={count}
          onChange={(event) => onCountChange(Number(event.target.value))}
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {Array.from({ length: 9 }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? 'passenger' : 'passengers'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
        >
          Continue to seat selection
        </button>
      </section>
    </div>
  );
}
