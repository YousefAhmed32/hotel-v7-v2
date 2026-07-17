import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginUser, logoutUser, registerUser, selectUser, selectIsAuthenticated, selectIsLoading, selectAuthError, selectUserRole, selectUserHotelId, clearError } from '../features/auth/authSlice.js';
export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);
  const role = useSelector(selectUserRole);
  const hotelId = useSelector(selectUserHotelId);
  const login = async (credentials) => {
    const result = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back!');
      const userRole = result.payload.user.role;
      navigate(userRole === 'customer' ? '/' : '/admin/dashboard');
      return true;
    }
    return false;
  };
  const register = async (userData) => {
    const result = await dispatch(registerUser(userData));
    if (registerUser.fulfilled.match(result)) { toast.success('Account created!'); navigate('/'); return true; }
    return false;
  };
  const logout = async () => { await dispatch(logoutUser()); toast.success('Logged out'); navigate('/auth/login'); };
  const isStaff = () => ['owner','manager','receptionist','superadmin'].includes(role);
  const hasRole = (...roles) => roles.includes(role);
  const hasPermission = (permission) => user?.permissions?.includes(permission) || ['superadmin','owner'].includes(role);
  return { user, isAuthenticated, isLoading, error, role, hotelId, login, register, logout, isStaff, hasRole, hasPermission, dismissError: () => dispatch(clearError()) };
};
