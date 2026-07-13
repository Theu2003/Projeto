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
  latitude?: number;
  longitude?: number;
  serviceAreaRadius?: number;
  materials?: string[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  approvedCompanies: number;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  totalPoints: number;
}

export interface MonthlyReport {
  month: string;
  newUsers: number;
  newCompanies: number;
  completedRequests: number;
  totalWeight: number;
}

export type RequestStatus = 'pending' | 'accepted' | 'on_the_way' | 'completed' | 'cancelled' | 'rescheduled';

export interface CollectionRequest {
  id: string;
  userId: string;
  companyId?: string;
  status: RequestStatus;
  materialType: string;
  quantityKg: number;
  observations?: string;
  photos?: string[];
  desiredDate?: string;
  desiredTime?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  realWeight?: number;
  completedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    phone?: string;
  };
  company?: { id: string; name: string; rating: number };
  timeline?: TimelineEntry[];
}

export interface TimelineEntry {
  status: RequestStatus;
  timestamp: string;
}

export interface Review {
  id: string;
  userId: string;
  companyId: string;
  requestId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface Material {
  id: string;
  name: string;
  icon: string;
  category: string;
  recyclable: boolean;
  pointsPerKg: number;
}

export interface ResidentDashboardData {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  points: number;
}

export interface CreateRequestPayload {
  materialType: string;
  quantityKg: number;
  observations?: string;
  desiredDate?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface CompanyDashboardData {
  company: {
    id: string;
    name: string;
    rating: number;
  };
  stats: {
    totalRequests: number;
    pendingRequests: number;
    completedToday: number;
    totalCollected: number;
  };
  recentReviews: Review[];
}
