import { api } from './client';
import type { Order } from '../types';

const ORDER_BASE = (storeId: string) => `/${storeId}/orders`;

export const ordersApi = {
  getById: async (storeId: string, orderId: string): Promise<Order> => {
    return api.get<Order>(`${ORDER_BASE(storeId)}/${orderId}`);
  },

  lookup: async (storeId: string, orderNumber: string, email: string): Promise<Order | null> => {
    return api.get<Order>(`${ORDER_BASE(storeId)}/lookup?orderNumber=${orderNumber}&email=${encodeURIComponent(email)}`);
  },
};
