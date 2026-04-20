import { api } from './client';

export interface GuestSessionResponse {
  sessionId: string;
  expiresAt: string;
  isNew: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
}

const SESSIONS_BASE = (publicId: string) => `/${publicId}/sessions`;

export const sessionsApi = {
  /**
   * Get or create a guest session
   * Automatically sets httpOnly cookie
   */
  getOrCreate: async (publicId: string): Promise<GuestSessionResponse> => {
    return api.get<GuestSessionResponse>(`${SESSIONS_BASE(publicId)}`);
  },

  /**
   * Get current session info
   */
  getCurrent: async (publicId: string): Promise<GuestSessionResponse> => {
    return api.get<GuestSessionResponse>(`${SESSIONS_BASE(publicId)}/current`);
  },

  /**
   * Refresh session (extend expiry)
   */
  refresh: async (publicId: string): Promise<GuestSessionResponse> => {
    return api.post<GuestSessionResponse>(`${SESSIONS_BASE(publicId)}/refresh`, {});
  },

  /**
   * Logout / revoke session
   */
  logout: async (publicId: string): Promise<void> => {
    return api.post<void>(`${SESSIONS_BASE(publicId)}/logout`, {});
  },
};
