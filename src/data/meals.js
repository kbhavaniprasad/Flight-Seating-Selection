/**
 * Mock meal options. Each passenger can pick at most one meal.
 */
export const MEALS = [
  { id: 'none', label: 'No Meal', price: 0, category: 'free' },
  { id: 'standard-veg', label: 'Standard Veg', price: 0, category: 'free' },
  { id: 'standard-non-veg', label: 'Standard Non-Veg', price: 0, category: 'free' },
  { id: 'kids-meal', label: 'Kids Meal', price: 0, category: 'free' },
  { id: 'vegan', label: 'Vegan', price: 150, category: 'paid' },
  { id: 'chefs-special', label: "Premium Chef's Special", price: 300, category: 'paid' },
];

export const DEFAULT_MEAL_ID = 'none';

export function getMealById(mealId) {
  return MEALS.find((m) => m.id === mealId) || MEALS[0];
}
