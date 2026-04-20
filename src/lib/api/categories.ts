import { api } from './client';
import type { Category, Product, PagedResponse } from '../types';

const CATEGORIES_BASE = (storeId: string) => `/${storeId}/categories`;

export interface CategoryFilters {
  search?: string
  parentId?: string
}

const buildFilterParams = (filters?: CategoryFilters): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.parentId) params.append("parentId", filters.parentId);
  return params;
};

export const categoriesApi = {
  getAll: async (
    storeId: string,
    page = 0,
    size = 20,
    filters?: CategoryFilters
  ): Promise<PagedResponse<Category>> => {
    const filterParams = buildFilterParams(filters);
    filterParams.set("page", String(page));
    filterParams.set("size", String(size));
    return api.get<PagedResponse<Category>>(`${CATEGORIES_BASE(storeId)}?${filterParams}`);
  },

  getById: async (
    storeId: string,
    id: string,
    withChildren = false,
    withProducts = false
  ): Promise<Category> => {
    const params = new URLSearchParams();
    if (withChildren) params.set("withChildren", "true");
    if (withProducts) params.set("withProducts", "true");
    const query = params.toString() ? `?${params}` : "";
    return api.get<Category>(`${CATEGORIES_BASE(storeId)}/${id}${query}`);
  },

  getBySlug: async (
    storeId: string,
    slug: string,
    withChildren = false,
    withProducts = false
  ): Promise<Category> => {
    // Note: The server endpoint does not return children/products even with these params.
    // Use separate endpoints for children: getByParent() and products: getCategoryProducts()
    const params = new URLSearchParams();
    if (withChildren) params.set("withChildren", "true");
    if (withProducts) params.set("withProducts", "true");
    const query = params.toString() ? `?${params}` : "";
    return api.get<Category>(`${CATEGORIES_BASE(storeId)}/by-slug/${encodeURIComponent(slug)}${query}`);
  },

  getRoot: async (storeId: string): Promise<PagedResponse<Category>> => {
    return api.get<PagedResponse<Category>>(`${CATEGORIES_BASE(storeId)}?root=true`);
  },

  getTree: async (storeId: string): Promise<PagedResponse<Category>> => {
    return api.get<PagedResponse<Category>>(`${CATEGORIES_BASE(storeId)}?tree=true`);
  },

  getByParent: async (
    storeId: string,
    parentId: string,
    page = 0,
    size = 20
  ): Promise<PagedResponse<Category>> => {
    return api.get<PagedResponse<Category>>(
      `${CATEGORIES_BASE(storeId)}?childrenOf=${encodeURIComponent(parentId)}&page=${page}&size=${size}`
    );
  },

  getCategoryProducts: async (
    storeId: string,
    categoryId: string,
    page = 0,
    size = 20
  ): Promise<PagedResponse<Product>> => {
    return api.get<PagedResponse<Product>>(
      `${CATEGORIES_BASE(storeId)}/${categoryId}/products?page=${page}&size=${size}`
    );
  },
};
