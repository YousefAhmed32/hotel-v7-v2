import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated, selectIsInitialized,
  selectUserRole, selectUserHotelId,
} from '@/features/auth/authSlice';
import { PageLoader } from './LoadingSpinner';

export const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized   = useSelector(selectIsInitialized);
  const location        = useLocation();
  if (!isInitialized)   return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location }} replace />;
  return children;
};

export const RoleRoute = ({ children, roles = [] }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized   = useSelector(selectIsInitialized);
  const role            = useSelector(selectUserRole);
  const hotelId         = useSelector(selectUserHotelId);
  const location        = useLocation();

  if (!isInitialized)   return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location }} replace />;
  if (roles.length && !roles.includes(role)) return <Navigate to="/unauthorized" replace />;

  // Owner بدون فندق — لازم يعمل setup أول
  if (role === 'owner' && !hotelId && location.pathname !== '/admin/setup') {
    return <Navigate to="/admin/setup" replace />;
  }

  return children;
};

export const GuestRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized   = useSelector(selectIsInitialized);
  const role            = useSelector(selectUserRole);
  const hotelId         = useSelector(selectUserHotelId);

  if (!isInitialized)   return <PageLoader />;
  if (isAuthenticated) {
    const STAFF = ['owner','manager','receptionist','superadmin'];
    if (STAFF.includes(role)) {
      // Owner جديد بدون فندق — يروح على setup
      if (role === 'owner' && !hotelId) return <Navigate to="/admin/setup" replace />;
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }
  return children;
};
