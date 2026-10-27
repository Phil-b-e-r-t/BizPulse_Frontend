import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageSpinner } from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';

/** Wraps every private route. Unauthenticated users go to /login and come back afterwards. */
export default function ProtectedRoute() {
  const { status, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner label="Checking your session" />;
  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ErrorState title="Cannot reach BizPulse" message="Check your connection and try again." onRetry={retry} />
      </div>
    );
  }
  if (status === 'unauthenticated') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
