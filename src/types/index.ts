export interface User {
  id: string;
  name: string;
  email: string;
  role: 'resident' | 'admin';
  phone?: string;
  cpf?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  points: number;
  active: boolean;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  cnpj: string;
  responsible: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceAreaRadius: number;
  materials: string[];
  approved: boolean;
  active: boolean;
  rating: number;
}

export interface AuthResponse {
  token: string;
  user: User | Company;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
}

export interface RegisterCompanyRequest {
  name: string;
  email: string;
  password: string;
  cnpj: string;
  responsible: string;
  phone: string;
  address: string;
}
