import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/services/api';
import { User, Company, AuthResponse, LoginRequest, RegisterCompanyRequest } from '@/types';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: LoginRequest) => Promise<void>;
  registerCompany: (data: RegisterCompanyRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = user !== null || company !== null;

  useEffect(() => {
    const token = apiClient.getToken();
    if (token) {
      restoreUser();
    }
  }, []);

  async function restoreUser() {
    try {
      const response = await apiClient.get<User>('/users/me');
      setUser(response);
    } catch {
      apiClient.clearToken();
    }
  }

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      apiClient.setToken(response.token);
      setUser(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(data: LoginRequest) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register/resident', data);
      apiClient.setToken(response.token);
      setUser(response.user as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function registerCompany(data: RegisterCompanyRequest) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register/company', data);
      apiClient.setToken(response.token);
      setCompany(response.user as Company);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Company registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    apiClient.clearToken();
    setUser(null);
  }

  function clearError() {
    setError(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        registerCompany,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
