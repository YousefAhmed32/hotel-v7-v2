import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { X, LayoutDashboard, Monitor, CalendarCheck, Bell, MessageSquare } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { selectSidebarCollapsed } from '@/features/ui/uiSlice';
import { selectUserRole } from '@/features/auth/authSlice';
import { cn } from '@/utils/cn';

const G = { gold: '#f6a003', goldDim: 'rgba(246,160,3,0.12)' };
const SIDEBAR_BG = '#0f1117';
const SIDEBAR_SEP = '#1c1f2e';

const BOTTOM_TABS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
  { to: '/admin/reception', icon: Monitor, labelKey: 'sidebar.reception' },
  { to: '/admin/bookings', icon: CalendarCheck, labelKey: 'sidebar.bookings' },
  { to: '/admin/requests', icon: Bell, labelKey: 'sidebar.requests' },
  { to: '/admin/chat', icon: MessageSquare, labelKey: 'sidebar.chat' },
];

const BottomNav = ({ isRtl }) => {
  const { t } = useTranslation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-white" style={{
      borderTop: '1px solid #f0f0f0',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {BOTTOM_TABS.map(({ to, icon: Icon, labelKey }) => (
        <NavLink key={to} to={to} end className="flex-1">
          {({ isActive }) => (
            <div className="flex flex-col items-center justify-center py-2 gap-1 transition-all" style={{ color: isActive ? G.gold : '#9ca3af' }}>
              <div className="w-9 h-7 rounded-xl flex items-center justify-center transition-all" style={{ background: isActive ? G.goldDim : 'transparent' }}>
                <Icon style={{ width: 17, height: 17, color: isActive ? G.gold : '#9ca3af' }} />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: isActive ? G.gold : '#9ca3af' }}>
                {t(labelKey)}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

const MobileDrawer = ({ open, onClose, isRtl }) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 lg:hidden" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={onClose} />

        <motion.div initial={{ x: isRtl ? 280 : -280 }} animate={{ x: 0 }} exit={{ x: isRtl ? 280 : -280 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-0 bottom-0 z-50 lg:hidden flex flex-col" style={{
            [isRtl ? 'left' : 'right']: 0,
                        width: 260,
            background: SIDEBAR_BG,
          }}>
          <button onClick={onClose} className="absolute top-4 w-8 h-8 rounded-xl flex items-center justify-center transition-colors z-10" style={{
            [isRtl ? 'left' : 'right']: 16,
            background: 'rgba(255,255,255,0.07)',
            color: '#6b7280',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}>
            <X style={{ width: 15, height: 15 }} />
          </button>

          <div className="flex-1 overflow-hidden">
            <AdminSidebar />
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export const AdminLayout = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const collapsed = useSelector(selectSidebarCollapsed);
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const sidebarWidth = collapsed ? 64 : 248;

  return (
    <div className="min-h-screen flex bg-[#f6f7f9]" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 h-screen z-40" style={{
        [isRtl ? 'right' : 'left']: 0,
        width: sidebarWidth,
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <AdminSidebar />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} isRtl={isRtl} />

      {/* Page wrapper */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-[220ms]"
  style={{
    marginLeft: isMobile ? 0 : isRtl ? 0 : sidebarWidth,
    marginRight: isMobile ? 0 : isRtl ? sidebarWidth : 0,
  }}>
        <AdminHeader onMenuClick={() => setDrawerOpen(true)} />

        <main className="flex-1 overflow-auto" style={{ paddingBottom: isMobile ? 72 : 0 }}>
          <div className="max-w-[1600px] mx-auto p-4 sm:p-5 lg:p-6">
          <Outlet />
          </div>
        </main>

        <footer className="hidden lg:flex items-center justify-between px-6 py-2.5 flex-shrink-0 bg-white" style={{ borderTop: '1px solid #f0f0f0' }}>
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} LuxStay Admin</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-neutral-400">System online</p>
          </div>
        </footer>
      </div>

      <BottomNav isRtl={isRtl} />
    </div>
  );
};