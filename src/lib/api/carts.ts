import { api } from './client';
import type { Cart, CartItem } from '../types';

const CARTS_BASE = (storeId: string) => `/${storeId}/carts`;
const CART_ITEMS = (storeId: string, cartId: string) => `${CARTS_BASE(storeId)}/${cartId}/items`;
const CART_ITEM = (storeId: string, cartId: string, productId: string) => `${CARTS_BASE(storeId)}/${cartId}/items/${productId}`;

export interface AddToCartInput {
  productId: string;
  quantity: number;
  selected?: boolean;
}

export interface UpdateCartItemInput {
  quantity?: number;
  selected?: boolean;
}

export const cartsApi = {
  /**
   * Get cart by store ID
   * Session is read from httpOnly cookie automatically
   */
  get: async (storeId: string): Promise<Cart> => {
    return api.get<Cart>(CARTS_BASE(storeId));
  },

  /**
   * Create a new cart
   * Session is read from httpOnly cookie automatically
   */
  create: async (storeId: string): Promise<Cart> => {
    return api.post<Cart>(CARTS_BASE(storeId), {});
  },

  /**
   * Save (create or update) cart
   * Sends entire cart object with items
   */
  save: async (storeId: string, cart: Cart): Promise<Cart> => {
    return api.post<Cart>(CARTS_BASE(storeId), cart);
  },

  /**
   * Delete cart by ID
   */
  delete: async (storeId: string, cartId: string): Promise<void> => {
    return api.delete<void>(`${CARTS_BASE(storeId)}/${cartId}`);
  },

  /**
   * Add item to cart
   * POST /stores/{storeId}/carts/{cartId}/items
   */
  addItem: async (storeId: string, cartId: string, input: AddToCartInput): Promise<CartItem> => {
    return api.post<CartItem>(CART_ITEMS(storeId, cartId), {
      productId: input.productId,
      quantity: input.quantity,
      selected: input.selected ?? true,
    });
  },

  /**
   * Update cart item
   * PUT /stores/{storeId}/carts/{cartId}/items/{productId}
   */
  updateItem: async (
    storeId: string,
    cartId: string,
    productId: string,
    input: UpdateCartItemInput
  ): Promise<CartItem> => {
    return api.put<CartItem>(CART_ITEM(storeId, cartId, productId), input);
  },

  /**
   * Remove item from cart
   * DELETE /stores/{storeId}/carts/{cartId}/items/{productId}
   */
  removeItem: async (storeId: string, cartId: string, productId: string): Promise<void> => {
    return api.delete<void>(CART_ITEM(storeId, cartId, productId));
  },

  /**
   * Clear selected items from cart
   * DELETE /stores/{storeId}/carts/{cartId}/items/selected
   */
  clearSelectedItems: async (storeId: string, cartId: string): Promise<{ deleted: number }> => {
    return api.delete<{ deleted: number }>(`${CARTS_BASE(storeId)}/${cartId}/items/selected`);
  },
};

export type { Cart, CartItem };
