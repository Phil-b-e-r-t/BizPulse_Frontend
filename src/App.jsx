import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicOnlyRoute from './routes/PublicOnlyRoute';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AcceptInvite from './pages/AcceptInvite';
import DashboardPage from './pages/DashboardPage';
import SellPage from './pages/SellPage';
import InventoryPage from './pages/InventoryPage';
import TransactionsPage from './pages/Transactions';
import ExpensesPage from './pages/Expenses';
import WhatsAppSettingsPage from './pages/WhatsAppSettingsPage';
import Billing from './pages/Billing';
import BillingComplete from './pages/BillingComplete';
import TeamSettings from './pages/TeamSettings';
import Messages from './pages/Messages';
import MorePage from './pages/MorePage';
import ComingSoonPage from './pages/ComingSoonPage';
import RoleRoute from './routes/RoleRoute';
import { useAuth } from './context/AuthContext';
import AdminOverview from './pages/admin/AdminOverview';
import AdminSessions from './pages/admin/AdminSessions';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminSettings from './pages/admin/AdminSettings';
import AdminFinance from './pages/admin/AdminFinance';
import AdminReportCenter from './pages/admin/AdminReportCenter';

// Super admins have no business, so "/" sends them to the admin overview.
function Home() {
  const { user } = useAuth();
  return user?.role === 'superadmin' ? <Navigate to="/admin" replace /> : <DashboardPage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/accept-invite" element={<AcceptInvite />} />
      </Route>

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/dashboard" element={<Home />} />
          <Route element={<RoleRoute allow={['superadmin']} />}>
            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/accounts" element={<AdminAccounts />} />
            <Route path="/admin/sessions" element={<AdminSessions />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/admin/finance" element={<AdminFinance />} />
            <Route path="/admin/reports" element={<AdminReportCenter />} />
            <Route path="/admin/audit" element={<AdminAuditLog />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
          <Route path="/more" element={<MorePage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/settings/billing" element={<Billing />} />
          <Route path="/settings/team" element={<TeamSettings />} />
          <Route path="/billing/complete" element={<BillingComplete />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<WhatsAppSettingsPage />} />
          <Route path="*" element={<ComingSoonPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
