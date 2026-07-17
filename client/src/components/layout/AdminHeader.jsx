import { useTranslation } from 'react-i18next';
import { Bell, RefreshCw, Menu } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { selectUser, selectUserRole } from '@/features/auth/authSlice';
import { notificationApi } from '@/services/notificationApi';
import { cn } from '@/utils/cn';
import { formatRelative } from '@/utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

const G = { gold: '#f6a003', goldLight: '#fff7e6' };

const TYPE_ICONS = {
  booking_created: '📅', booking_approved: '✅', booking_rejected: '❌',
  booking_checkin: '🏨', booking_checkout: '🚪', booking_cancelled: '🚫',
  payment_received: '💰', payment_approved: '✅', payment_rejected: '❌',
  room_request: '🛎', chat_message: '💬', review_posted: '⭐',
};

const PAGE_TITLES = {
  '/admin/superadmin': 'admin.allHotels',
  '/admin/dashboard': 'admin.dashboard',
  '/admin/reception': 'admin.reception',
  '/admin/calendar': 'admin.calendar',
  '/admin/rooms': 'admin.rooms',
  '/admin/bookings': 'admin.bookings',
  '/admin/analytics': 'admin.analytics',
  '/admin/pricing': 'admin.aiPricing',
  '/admin/offers': 'admin.offers',
  '/admin/reviews': 'admin.reviews',
  '/admin/housekeeping': 'admin.housekeeping',
  '/admin/requests': 'admin.requests',
  '/admin/chat': 'admin.chat',
  '/admin/staff': 'admin.staff',
  '/admin/settings': 'admin.settings',
};

const ROLE_CONFIG = {
  superadmin: { label: 'admin.superAdmin', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  owner: { label: 'admin.owner', bg: G.goldLight, color: '#b45309', border: '#fde68a' },
  manager: { label: 'admin.manager', bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' },
  receptionist: { label: 'admin.receptionist', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
};

const NotifPanel = ({ notifs, loading, onRefresh, isRtl }) => (
  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
    transition={{ duration: 0.14 }}
    className="absolute top-12 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-50 overflow-hidden"
    style={{ width: 340, [isRtl ? 'left' : 'right']: 0 }}>

    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f5f5f5' }}>
      <p className="font-bold text-sm text-neutral-900">Notifications</p>
      <button onClick={onRefresh} className="w-7 h-7 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-400 transition-colors">
        <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
      </button>
    </div>

    <div className="overflow-y-auto max-h-[320px]" style={{ scrollbarWidth: 'none' }}>
      {notifs.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: G.goldLight }}>
            <Bell className="w-5 h-5" style={{ color: G.gold }} />
          </div>
          <p className="text-sm font-medium text-neutral-500">All caught up!</p>
          <p className="text-xs text-neutral-400">No new notifications</p>
        </div>
      ) : notifs.map(n => (
        <div key={n._id} className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-neutral-50" style={{
          borderBottom: '1px solid #fafafa',
          background: n.isRead ? '' : 'rgba(246,160,3,0.04)',
          textAlign: isRtl ? 'right' : 'left',
        }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 bg-neutral-100">
            {TYPE_ICONS[n.type] || '🔔'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-[13px] leading-snug', n.isRead ? 'text-neutral-600 font-normal' : 'text-neutral-900 font-semibold')}>
              {n.title}
            </p>
            {n.body && <p className="text-xs text-neutral-400 mt-0.5 truncate">{n.body}</p>}
            <p className="text-[11px] text-neutral-300 mt-1">{formatRelative(n.createdAt)}</p>
          </div>
          {!n.isRead && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: G.gold }} />}
        </div>
      ))}
    </div>

    <div className="px-4 py-2.5 bg-neutral-50" style={{ borderTop: '1px solid #f5f5f5' }}>
      <p className="text-xs text-neutral-400 text-center">Showing latest 12 notifications</p>
    </div>
  </motion.div>
);

export const AdminHeader = ({ onMenuClick }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const user = useSelector(selectUser);
  const role = useSelector(selectUserRole);
  const location = useLocation();

  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.receptionist;

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || 'admin.dashboard';

  const todayStr = new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await notificationApi.getAll({ limit: 12 });
      setNotifs(data.data.notifications || []);
      setUnread(data.data.unreadCount || 0);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const handleBellClick = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await notificationApi.markRead([]);
      setUnread(0);
      setNotifs(p => p.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 sticky top-0 z-30 flex-shrink-0 bg-white"
      style={{ borderBottom: '1px solid #f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
      dir={isRtl ? 'rtl' : 'ltr'}>

      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 transition-colors flex-shrink-0" aria-label="Open navigation">
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-neutral-900 leading-tight truncate">{t(pageTitle)}</h1>
          <p className="text-[11px] text-neutral-400 hidden sm:block mt-0.5">{todayStr}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">

        <div className="relative">
          <button onClick={handleBellClick} className="relative w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors">
            <Bell className="w-[18px] h-[18px]" />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute top-1.5 flex items-center justify-center font-bold bg-red-500 text-white rounded-full" style={{
                    right: 6, width: 15, height: 15, fontSize: 9,
                  }}>
                  {unread > 9 ? '9+' : unread}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <NotifPanel notifs={notifs} loading={loading} onRefresh={fetchNotifs} isRtl={isRtl} />
              </>
            )}
          </AnimatePresence>
        </div>
        <button
  onClick={() => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  }}
  className="px-3 h-9 rounded-xl text-xs font-bold border border-neutral-200 hover:bg-neutral-100 transition"
>
  {i18n.language === 'ar' ? 'EN' : 'ع'}
</button>
        <div className="w-px h-6 bg-neutral-200 mx-1" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0" style={{ background: G.gold }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-[13px] font-bold text-neutral-800 leading-tight truncate max-w-[120px]">
              {user?.name}
            </p>
            <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none border mt-0.5" style={{
              background: roleConfig.bg, color: roleConfig.color, borderColor: roleConfig.border,
            }}>
              {t(roleConfig.label)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};