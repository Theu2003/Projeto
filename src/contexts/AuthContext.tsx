import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/services/api';
import { User, Company, AuthResponse, LoginRequest, RegisterRequest, RegisterCompanyRequest } from '@/types';

export interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  registerCompany: (data: RegisterCompanyRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      if (response.company) {
        setCompany(response.company);
        setUser(null);
      } else {
        setUser(response.user as User);
        setCompany(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function googleLogin(credential: string) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/google', { credential });
      apiClient.setToken(response.token);
      setUser(response.user as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login com Google');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(data: RegisterRequest) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register/resident', data);
      apiClient.setToken(response.token);
      setUser(response.user as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro');
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
      setCompany(response.company as Company);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no cadastro da empresa');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    apiClient.clearToken();
    setUser(null);
    setCompany(null);
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
        googleLogin,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
