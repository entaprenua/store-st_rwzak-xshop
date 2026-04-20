export const apiRoutes = {
  // Store-specific customer auth (not platform /auth/*)
  customers: {
    login: (storeId: string) => `/${storeId}/customers/login`,
    register: (storeId: string) => `/${storeId}/customers/register`,
    logout: (storeId: string) => `/${storeId}/customers/logout`,
    me: (storeId: string, customerId: string) => `/${storeId}/customers/me?customerId=${customerId}`,
    verifyEmail: (storeId: string) => `/${storeId}/customers/verify`,
    resendVerification: (storeId: string) => `/${storeId}/customers/resend-verification`,
    passwordResetRequest: (storeId: string) => `/${storeId}/customers/password-reset/request`,
    passwordResetConfirm: (storeId: string) => `/${storeId}/customers/password-reset/confirm`,
  },
  // Session management
  sessions: {
    getOrCreate: (storeId: string) => `/${storeId}/sessions`,
    current: (storeId: string) => `/${storeId}/sessions/current`,
    refresh: (storeId: string) => `/${storeId}/sessions/refresh`,
    logout: (storeId: string) => `/${storeId}/sessions/logout`,
  },
  products: {
    base: (storeId: string) => `/${storeId}/products`,
    byId: (storeId: string, id: string) => `/${storeId}/products/${id}`,
    bySlug: (storeId: string, slug: string) => `/${storeId}/products/by-slug/${slug}`,
    byCategory: (storeId: string, categoryId: string) => `/${storeId}/products/category/${categoryId}`,
    search: (storeId: string) => `/${storeId}/products/search`,
  },
  categories: {
    base: (storeId: string) => `/${storeId}/categories`,
    byId: (storeId: string, id: string) => `/${storeId}/categories/${id}`,
    bySlug: (storeId: string, slug: string) => `/${storeId}/categories/by-slug/${slug}`,
    root: (storeId: string) => `/${storeId}/categories/root`,
    tree: (storeId: string) => `/${storeId}/categories/tree`,
  },
  carts: {
    base: (storeId: string) => `/${storeId}/carts`,
    byId: (storeId: string, id: string) => `/${storeId}/carts/${id}`,
  },
  orders: {
    base: (storeId: string) => `/${storeId}/orders`,
    byId: (storeId: string, id: string) => `/${storeId}/orders/${id}`,
    lookup: (storeId: string) => `/${storeId}/orders/lookup`,
  },
  wishlists: {
    base: (storeId: string) => `/${storeId}/wishlists`,
    byId: (storeId: string, id: string) => `/${storeId}/wishlists/${id}`,
  },
  heroes: {
    byStoreId: (storeId: string) => `/${storeId}/heroes`,
    activeByStoreId: (storeId: string) => `/${storeId}/heroes/active`,
    byId: (storeId: string, id: string) => `/${storeId}/heroes/${id}`,
  },
  payments: {
    create: '/payments/create',
    byId: (id: string) => `/payments/${id}`,
    byOrderId: (orderId: string) => `/payments/order/${orderId}`,
    status: (id: string) => `/payments/${id}/status`,
  },
  recommendations: {
    base: (storeId: string) => `/${storeId}/recommendations`,
    trackView: (storeId: string, productId: string) => `/${storeId}/products/${productId}/view`,
  },
};