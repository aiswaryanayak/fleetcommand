import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import TripsPage from './pages/TripsPage';
import DriversPage from './pages/DriversPage';
import MaintenancePage from './pages/MaintenancePage';
import FinancePage from './pages/FinancePage';
import AnalyticsPage from './pages/AnalyticsPage';

/* ──────────── Guards ──────────── */
function RequireAuth() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function RequireRole({ allowed }) {
  const { hasRole } = useAuth();
  if (!hasRole(allowed)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/* ──────────── Layout ──────────── */
function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

/* ──────────── App ──────────── */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated shell */}
      <Route element={<RequireAuth />}>
        {/* Dashboard — accessible to all roles */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Vehicle Registry — fleet_manager */}
        <Route element={<RequireRole allowed={['fleet_manager']} />}>
          <Route path="/vehicles" element={<VehiclesPage />} />
        </Route>

        {/* Trip Dispatcher — dispatcher */}
        <Route element={<RequireRole allowed={['dispatcher']} />}>
          <Route path="/trips" element={<TripsPage />} />
        </Route>

        {/* Driver Safety — safety_officer */}
        <Route element={<RequireRole allowed={['safety_officer']} />}>
          <Route path="/drivers" element={<DriversPage />} />
        </Route>

        {/* Maintenance Logs — fleet_manager */}
        <Route element={<RequireRole allowed={['fleet_manager']} />}>
          <Route path="/maintenance" element={<MaintenancePage />} />
        </Route>

        {/* Finance — financial_analyst */}
        <Route element={<RequireRole allowed={['financial_analyst']} />}>
          <Route path="/finance" element={<FinancePage />} />
        </Route>

        {/* Analytics — fleet_manager, financial_analyst */}
        <Route element={<RequireRole allowed={['fleet_manager', 'financial_analyst']} />}>
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
