import { api } from './client';
import type { Store } from '../types';

const STORES_BASE = '/';

export const storesApi = {
  /**
   * Get store by publicId
   */
  getByPublicId: async (publicId: string): Promise<Store> => {
    return api.get<Store>(`${STORES_BASE}/${publicId}`);
  },
};

export type { Store };
