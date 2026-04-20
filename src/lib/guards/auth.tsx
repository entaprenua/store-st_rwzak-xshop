import { createContext, useContext, createSignal, onMount, type ParentComponent, type Accessor } from 'solid-js';
import { useStoreId } from '../store-context';

interface StoreCustomer {
  id: string;
  storeId: string;
  email: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: Accessor<StoreCustomer | null>;
  isAuthenticated: Accessor<boolean>;
  isLoading: Accessor<boolean>;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, name?: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface LoginResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

interface AuthResponse {
  success: boolean;
  customer?: StoreCustomer;
}

interface CustomerRegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface CustomerLoginRequest {
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType>();

export const AuthProvider: ParentComponent = (props) => {
  const storePublicId = useStoreId();
  const [user, setUser] = createSignal<StoreCustomer | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);

  const isAuthenticated = () => !!user();

  const getPublicId = () => storePublicId() ?? '';

  const fetchApi = async (path: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    return fetch(`/api/v1${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    const publicId = getPublicId();
    
    if (!publicId) {
      return {
        success: false,
        error: 'Store not loaded',
        errorCode: 'STORE_NOT_LOADED',
      };
    }

    try {
      const response = await fetchApi(`/${publicId}/customers/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password } as CustomerLoginRequest),
      });

      const text = await response.text();

      let data: AuthResponse;
      try {
        data = JSON.parse(text);
      } catch {
        return {
          success: false,
          error: 'Server error. Please try again later.',
          errorCode: 'SERVER_ERROR',
        };
      }

      if (response.ok && data.success && data.customer) {
        setUser(data.customer);
        return { success: true };
      }

      const errorData = data as { message?: string };
      return {
        success: false,
        error: errorData.message || 'Login failed',
        errorCode: 'LOGIN_FAILED',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        errorCode: 'NETWORK_ERROR',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<LoginResult> => {
    setIsLoading(true);
    const publicId = getPublicId();
    
    if (!publicId) {
      return {
        success: false,
        error: 'Store not loaded',
        errorCode: 'STORE_NOT_LOADED',
      };
    }

    try {
      const response = await fetchApi(`/${publicId}/customers/register`, {
        method: 'POST',
        body: JSON.stringify({ email, password, name } as CustomerRegisterRequest),
      });

      const text = await response.text();

      let data: AuthResponse;
      try {
        data = JSON.parse(text);
      } catch {
        return {
          success: false,
          error: 'Server error. Please try again later.',
          errorCode: 'SERVER_ERROR',
        };
      }

      if (response.ok && data.success && data.customer) {
        setUser(data.customer);
        return { success: true };
      }

      const errorData = data as { message?: string };
      return {
        success: false,
        error: errorData.message || 'Registration failed',
        errorCode: 'REGISTRATION_FAILED',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        errorCode: 'NETWORK_ERROR',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const publicId = getPublicId();
    
    try {
      if (publicId) {
        await fetchApi(`/${publicId}/customers/logout`, {
          method: 'POST',
        });
      }
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const publicId = getPublicId();
    const currentUser = user();
    
    if (!publicId || !currentUser?.id) return;

    try {
      const response = await fetchApi(`/${publicId}/customers/me?customerId=${currentUser.id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        }
      }
    } catch {
      // Network error, keep current state
    }
  };

  onMount(async () => {
    // Don't auto-refresh user on mount - wait for explicit login
    setIsLoading(false);
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
