import { localDb } from '../lib/localDb.ts';
import { SavedCalculationItem } from '../types/index.ts';

export type Unsubscribe = () => void;

/**
 * Save or update a calculation or countdown locally
 */
export async function saveUserCalculation(
  uid: string,
  item: SavedCalculationItem
): Promise<void> {
  localDb.saveItem('calculators', uid, {
    ...item,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a saved calculation or countdown
 */
export async function deleteUserCalculation(
  uid: string,
  itemId: string
): Promise<void> {
  localDb.deleteItem('calculators', uid, itemId);
}

/**
 * Subscribe to all saved calculations and countdowns for a user
 */
export function subscribeUserCalculations(
  uid: string,
  onUpdate: (items: SavedCalculationItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return localDb.subscribe<SavedCalculationItem>('calculators', uid, onUpdate, {
    orderByField: 'createdAt',
    orderDirection: 'desc',
  });
}
