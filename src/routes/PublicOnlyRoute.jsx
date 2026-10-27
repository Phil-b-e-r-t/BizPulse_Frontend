import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/ui/Spinner';

/** Login and register: signed-in users are sent to the dashboard instead. */
export default function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageSpinner label="Loading" />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}
