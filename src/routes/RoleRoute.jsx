import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** UI guard only. The backend must still reject non-superadmin calls to every /admin endpoint. */
export default function RoleRoute({ allow }) {
  const { user } = useAuth();
  return allow.includes(user?.role) ? <Outlet /> : <Navigate to="/" replace />;
}
