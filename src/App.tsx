import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ShopLayout } from '@/components/ShopLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { VehiclesPage } from '@/pages/VehiclesPage';
import { RepairOrdersPage } from '@/pages/RepairOrdersPage';
import { EstimatesPage } from '@/pages/EstimatesPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CustomerPortalPage } from '@/pages/CustomerPortalPage';
import { RepairGuidesPage } from '@/pages/RepairGuidesPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function ShopRoutes() {
  return (
    <ProtectedRoute>
      <ShopLayout>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/repair-orders" element={<RepairOrdersPage />} />
          <Route path="/estimates" element={<EstimatesPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/repair-guides" element={<RepairGuidesPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ShopLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/portal" element={<CustomerPortalPage />} />
          <Route path="/*" element={<ShopRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
