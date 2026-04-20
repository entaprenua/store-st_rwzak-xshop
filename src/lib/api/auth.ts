import { api } from './client'
import type {
  User,
  LoginRequest, LoginResponse,
  RegisterRequest, RegisterResponse,
  PasswordResetRequestRequest, PasswordResetConfirmRequest,
  EmailVerificationRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../types'
import type { EmailServerValidationResult } from '../utils/validation'

const AUTH_BASE = '/auth'

export interface SessionInfo {
  id: string
  deviceType: string | null
  browser: string | null
  os: string | null
  ipAddress: string | null
  lastAccessedAt: string | null
  createdAt: string | null
  isActive: boolean
  isCurrent: boolean
}

export interface OAuthNeedsConfirmation {
  needsConfirmation: boolean
  email: string
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>(`${AUTH_BASE}/login`, credentials)
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>(`${AUTH_BASE}/register`, data)
  },

  logout: async (): Promise<void> => {
    await api.post(`${AUTH_BASE}/logout`, {})
  },

  me: async (): Promise<User> => {
    return api.get<User>(`${AUTH_BASE}/me`)
  },

  refresh: async (): Promise<LoginResponse> => {
    return api.post<LoginResponse>(`${AUTH_BASE}/refresh`, {})
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    return api.put<User>(`${AUTH_BASE}/profile`, data)
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    return api.post<void>(`${AUTH_BASE}/change-password`, data)
  },

  requestPasswordReset: async (data: PasswordResetRequestRequest): Promise<void> => {
    return api.post<void>(`${AUTH_BASE}/password-reset/request`, data)
  },

  confirmPasswordReset: async (data: PasswordResetConfirmRequest): Promise<void> => {
    return api.post<void>(`${AUTH_BASE}/password-reset/confirm`, data)
  },

  verifyEmail: async (data: EmailVerificationRequest): Promise<User> => {
    return api.post<User>(`${AUTH_BASE}/verify-email`, data)
  },

  resendVerification: async (email: string): Promise<void> => {
    return api.post<void>(`${AUTH_BASE}/resend-verification`, { email })
  },

  getSessions: async (): Promise<SessionInfo[]> => {
    return api.get<SessionInfo[]>(`${AUTH_BASE}/sessions`)
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    return api.delete<void>(`${AUTH_BASE}/sessions/${sessionId}`)
  },

  revokeAllSessions: async (): Promise<void> => {
    return api.post<void>(`${AUTH_BASE}/sessions/revoke-all`, {})
  },

  validateEmail: async (email: string): Promise<EmailServerValidationResult> => {
    return api.get<EmailServerValidationResult>(
      `${AUTH_BASE}/validate-email?email=${encodeURIComponent(email)}`
    )
  },

  checkEmailExists: async (email: string): Promise<{ exists: boolean; provider?: string }> => {
    return api.get<{ exists: boolean; provider?: string }>(
      `${AUTH_BASE}/check-email?email=${encodeURIComponent(email)}`
    )
  },

  checkUsernameExists: async (username: string): Promise<{ exists: boolean }> => {
    return api.get<{ exists: boolean }>(
      `${AUTH_BASE}/check-username?username=${encodeURIComponent(username)}`
    )
  },

  getOAuthUrl: async (provider: string): Promise<{ url: string }> => {
    return api.get<{ url: string }>(
      `${AUTH_BASE}/oauth/${provider}`
    )
  },

  handleOAuthCallback: async (provider: string, code: string, state?: string): Promise<LoginResponse | OAuthNeedsConfirmation> => {
    return api.post<LoginResponse | OAuthNeedsConfirmation>(
      `${AUTH_BASE}/oauth/${provider}/callback`,
      { code, state }
    )
  },

  confirmOAuthLinking: async (provider: string, code: string, state: string, password: string): Promise<LoginResponse> => {
    return api.post<LoginResponse>(
      `${AUTH_BASE}/oauth/${provider}/confirm`,
      { code, state, password }
    )
  },
}

export const rolesApi = {
  getAll: async (): Promise<{ name: string; description: string | null }[]> => {
    return api.get<{ name: string; description: string | null }[]>(
      `${AUTH_BASE}/roles`
    )
  },

  getUserPermissions: async (userId: string): Promise<string[]> => {
    return api.get<string[]>(
      `${AUTH_BASE}/users/${userId}/permissions`
    )
  },

  hasPermission: async (permission: string): Promise<{ hasPermission: boolean }> => {
    return api.get<{ hasPermission: boolean }>(
      `${AUTH_BASE}/check-permission?permission=${encodeURIComponent(permission)}`
    )
  },
}
