import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';

// Auth
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';

// Módulos protegidos
import DashboardPage from '../features/dashboard/DashboardPage';
import AgentPage from '../features/agent/AgentPage';
import ProductsPage from '../features/products/ProductsPage';
import CustomersPage from '../features/customers/CustomersPage';
import CustomerRequestsPage from '../features/customer_requests/CustomerRequestsPage';
import OrdersPage from '../features/orders/OrdersPage';
import CommercialTermsPage from '../features/commercial_terms/CommercialTermsPage';
import IndicatorsPage from '../features/indicators/IndicatorsPage';
import ReportsPage from '../features/reports/ReportsPage';
import HistoryPage from '../features/history/HistoryPage';
import ProfilePage from '../features/profile/ProfilePage';
import SettingsPage from '../features/settings/SettingsPage';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rutas públicas (auth) */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/registro"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
        </Route>

        {/* Rutas protegidas (app principal) */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/agente" element={<AgentPage />} />
          <Route path="/productos" element={<ProductsPage />} />
          <Route path="/clientes" element={<CustomersPage />} />
          <Route path="/solicitudes" element={<CustomerRequestsPage />} />
          <Route path="/pedidos" element={<OrdersPage />} />
          <Route path="/condiciones" element={<CommercialTermsPage />} />
          <Route path="/indicadores" element={<IndicatorsPage />} />
          <Route path="/reportes" element={<ReportsPage />} />
          <Route path="/historial" element={<HistoryPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}