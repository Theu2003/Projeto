import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterResidentPage } from '@/pages/auth/RegisterResidentPage';
import { RegisterCompanyPage } from '@/pages/auth/RegisterCompanyPage';
import { ResidentDashboard } from '@/pages/resident/ResidentDashboard';
import { NewRequestPage } from '@/pages/resident/NewRequestPage';
import { RequestDetailPage as ResidentRequestDetail } from '@/pages/resident/RequestDetailPage';
import { HistoryPage } from '@/pages/resident/HistoryPage';
import { CompanyDashboard } from '@/pages/company/CompanyDashboard';
import { MapViewPage } from '@/pages/company/MapViewPage';
import { RequestDetailPage as CompanyRequestDetail } from '@/pages/company/RequestDetailPage';
import { CollectionProcessPage } from '@/pages/company/CollectionProcessPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ManageUsersPage } from '@/pages/admin/ManageUsersPage';
import { ManageCompaniesPage } from '@/pages/admin/ManageCompaniesPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  const { user, company, isAuthenticated } = useAuth();

  const role = company ? 'company' : user?.role || 'resident';
  const userName = company ? company.name : user?.name || '';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register/resident" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterResidentPage />} />
      <Route path="/register/company" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterCompanyPage />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <Layout role={role} userName={userName} />
          </ProtectedRoute>
        }
      >
        {/* Resident routes */}
        <Route path="/" element={<ResidentDashboard />} />
        <Route path="/requests/new" element={<NewRequestPage />} />
        <Route path="/requests/:id" element={<ResidentRequestDetail />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/ranking" element={<ResidentDashboard />} />

        {/* Company routes */}
        <Route path="/map" element={<MapViewPage />} />
        <Route path="/company/requests" element={<CompanyRequestDetail />} />
        <Route path="/company/requests/:id" element={<CompanyRequestDetail />} />
        <Route path="/company/collection" element={<CollectionProcessPage />} />

        {/* Admin routes */}
        <Route path="/admin/users" element={<ManageUsersPage />} />
        <Route path="/admin/companies" element={<ManageCompaniesPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppRoot() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return <AppRoot />;
}
