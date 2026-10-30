import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SellPage from './pages/SellPage';
import InventoryPage from './pages/InventoryPage';
import WhatsAppSettingsPage from './pages/WhatsAppSettingsPage';
import MorePage from './pages/MorePage';
import ComingSoonPage from './pages/ComingSoonPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/transactions" element={<ComingSoonPage />} />
          <Route path="/expenses" element={<ComingSoonPage />} />
          <Route path="/messages" element={<ComingSoonPage />} />
          <Route path="/settings" element={<WhatsAppSettingsPage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
