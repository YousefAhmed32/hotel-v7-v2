import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchCurrentUser, selectIsInitialized, selectUser, selectUserRole, selectUserHotelId } from '@/features/auth/authSlice';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { ProtectedRoute, RoleRoute, GuestRoute } from '@/components/common/ProtectedRoute';
import { PageLoader } from '@/components/common/LoadingSpinner';

// Auth
import LoginPage    from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Admin
import HotelSetupPage  from '@/pages/admin/HotelSetupPage';
import SuperAdminPage  from '@/pages/admin/SuperAdminPage';
import DashboardPage   from '@/pages/admin/DashboardPage';
import RoomsPage       from '@/pages/admin/RoomsPage';
import BookingsPage    from '@/pages/admin/BookingsPage';
import PricingPage     from '@/pages/admin/PricingPage';
import StaffPage       from '@/pages/admin/StaffPage';
import AnalyticsPage   from '@/pages/admin/AnalyticsPage';
import ChatPage        from '@/pages/admin/ChatPage';
import OffersPage      from '@/pages/admin/OffersPage';
import ReviewsPage     from '@/pages/admin/ReviewsPage';
import SettingsPage    from '@/pages/admin/SettingsPage';
import HousekeepingPage    from '@/pages/admin/HousekeepingPage';
import ReceptionPage     from '@/pages/admin/ReceptionPage';
import RequestsPage     from '@/pages/admin/RequestsPage';
import CalendarPage      from '@/pages/admin/CalendarPage';

// Customer
import HomePage           from '@/pages/customer/HomePage';
import SearchPage         from '@/pages/customer/SearchPage';
import RoomDetailPage     from '@/pages/customer/RoomDetailPage';
import HotelDetailPage    from '@/pages/customer/HotelDetailPage';
import CheckoutPage       from '@/pages/customer/CheckoutPage';
import BookingConfirmPage from '@/pages/customer/BookingConfirmPage';
import ProfilePage        from '@/pages/customer/ProfilePage';
import MyRoomPage        from '@/pages/customer/MyRoomPage';
import NotFoundPage       from '@/pages/NotFoundPage';

const STAFF = ['owner','manager','receptionist','superadmin'];

// صفحة "غير مصرح" بسيطة
const UnauthorizedPage = () => (
  <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
    <div className="text-center">
      <p className="text-6xl mb-4">🔒</p>
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">Access Denied</h1>
      <p className="text-neutral-400 mb-6">You don't have permission to view this page.</p>
      <a href="/" className="btn-gold px-6 py-2.5">Go Home</a>
    </div>
  </div>
);

export default function App() {
  const { i18n } = useTranslation();
  const dispatch      = useDispatch();
  const isInitialized = useSelector(selectIsInitialized);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) dispatch(fetchCurrentUser());
    else dispatch({ type: 'auth/fetchCurrentUser/rejected' });
  }, [dispatch]);

  if (!isInitialized) return <PageLoader />;

  return (
<ErrorBoundary>
<Toaster
  position="top-right"
  toastOptions={{
    style: {
      background: '#fff',
      color: '#171717',
      border: '1px solid #e5e5e5',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      fontSize: '14px',
    },

    success: {
      style: {
        background: '#fff8ed',   // خلفية خفيفة amber
        color: '#b45309',
      },
      iconTheme: {
        primary: '#f6a003',     // 🔥 لون علامة الصح
        secondary: '#fff',
      },
    },

    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    },
  }}
/>

      <Routes>
        {/* Auth */}
        <Route path="/auth/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/auth/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Hotel Setup — owner جديد لازم يمر من هنا */}
        <Route path="/admin/setup" element={
          <ProtectedRoute><HotelSetupPage /></ProtectedRoute>
        } />

        {/* Admin area */}
        <Route path="/admin" element={<RoleRoute roles={STAFF}><AdminLayout /></RoleRoute>}>
          <Route index            element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="superadmin"element={<SuperAdminPage />} />
          <Route path="rooms"     element={<RoomsPage />} />
          <Route path="bookings"  element={<BookingsPage />} />
          <Route path="pricing"   element={<PricingPage />} />
          <Route path="staff"     element={<StaffPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="chat"      element={<ChatPage />} />
          <Route path="offers"    element={<OffersPage />} />
          <Route path="reviews"      element={<ReviewsPage />} />
          <Route path="housekeeping" element={<HousekeepingPage />} />
          <Route path="reception"    element={<ReceptionPage />} />
          <Route path="requests"     element={<RequestsPage />} />
          <Route path="calendar"     element={<CalendarPage />} />
          <Route path="settings"  element={<SettingsPage />} />
        </Route>

        {/* Customer */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="hotels"     element={<SearchPage />} />
          <Route path="hotels/:id" element={<HotelDetailPage />} />
          <Route path="hotels/:hotelId/rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="checkout"   element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="booking-confirmation/:id" element={<ProtectedRoute><BookingConfirmPage /></ProtectedRoute>} />
          <Route path="my-room"          element={<ProtectedRoute><MyRoomPage /></ProtectedRoute>} />
          <Route path="profile"          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="profile/bookings" element={<ProtectedRoute><ProfilePage tab="bookings" /></ProtectedRoute>} />
          <Route path="profile/settings" element={<ProtectedRoute><ProfilePage tab="settings" /></ProtectedRoute>} />
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*"             element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
