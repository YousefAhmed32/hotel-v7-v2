import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, BedDouble, CalendarCheck, BarChart3,
  Tag, MessageSquare, Settings, LogOut,
  Users, Sparkles, Hotel, Star, Globe,
  Home, Bell, Monitor, CalendarDays, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { logoutUser, selectUser, selectUserRole } from '@/features/auth/authSlice';
import { selectSidebarCollapsed, collapseSidebar } from '@/features/ui/uiSlice';
import toast from 'react-hot-toast';

const S = {
  bg: '#0f1117',
  hover: '#181b26',
  sep: '#1c1f2e',
  gold: '#f6a003',
  goldDim: 'rgba(246,160,3,0.13)',
  txtPri: '#e8e8ea',
  txtMuted: '#555d70',
  txtFaint: '#2e3347',
};

const NAV_BY_ROLE = {
  superadmin: [
    { to: '/admin/superadmin', icon: Globe, labelKey: 'sidebar.allHotels', group: 'admin.super' },
    { to: '/admin/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', group: 'admin.main' },
    { to: '/admin/reception', icon: Monitor, labelKey: 'sidebar.reception', group: 'admin.main' },
    { to: '/admin/calendar', icon: CalendarDays, labelKey: 'sidebar.calendar', group: 'admin.main' },
    { to: '/admin/rooms', icon: BedDouble, labelKey: 'sidebar.rooms', group: 'admin.main' },
    { to: '/admin/bookings', icon: CalendarCheck, labelKey: 'sidebar.bookings', group: 'admin.main' },
    { to: '/admin/analytics', icon: BarChart3, labelKey: 'sidebar.analytics', group: 'admin.operations' },
    { to: '/admin/pricing', icon: Sparkles, labelKey: 'sidebar.aiPricing', group: 'admin.operations' },
    { to: '/admin/offers', icon: Tag, labelKey: 'sidebar.offers', group: 'admin.operations' },
    { to: '/admin/reviews', icon: Star, labelKey: 'sidebar.reviews', group: 'admin.operations' },
    { to: '/admin/housekeeping', icon: Home, labelKey: 'sidebar.housekeeping', group: 'admin.operations' },
    { to: '/admin/requests', icon: Bell, labelKey: 'sidebar.requests', group: 'admin.operations' },
    { to: '/admin/chat', icon: MessageSquare, labelKey: 'sidebar.chat', group: 'admin.operations' },
    { to: '/admin/staff', icon: Users, labelKey: 'sidebar.staff', group: 'admin.team' },
    { to: '/admin/settings', icon: Settings, labelKey: 'sidebar.settings', group: 'admin.team' },
  ],
  owner: [
    { to: '/admin/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', group: 'admin.main' },
    { to: '/admin/reception', icon: Monitor, labelKey: 'sidebar.reception', group: 'admin.main' },
    { to: '/admin/calendar', icon: CalendarDays, labelKey: 'sidebar.calendar', group: 'admin.main' },
    { to: '/admin/rooms', icon: BedDouble, labelKey: 'sidebar.rooms', group: 'admin.main' },
    { to: '/admin/bookings', icon: CalendarCheck, labelKey: 'sidebar.bookings', group: 'admin.main' },
    { to: '/admin/analytics', icon: BarChart3, labelKey: 'sidebar.analytics', group: 'admin.operations' },
    { to: '/admin/pricing', icon: Sparkles, labelKey: 'sidebar.aiPricing', group: 'admin.operations' },
    { to: '/admin/offers', icon: Tag, labelKey: 'sidebar.offers', group: 'admin.operations' },
    { to: '/admin/reviews', icon: Star, labelKey: 'sidebar.reviews', group: 'admin.operations' },
    { to: '/admin/housekeeping', icon: Home, labelKey: 'sidebar.housekeeping', group: 'admin.operations' },
    { to: '/admin/requests', icon: Bell, labelKey: 'sidebar.requests', group: 'admin.operations' },
    { to: '/admin/chat', icon: MessageSquare, labelKey: 'sidebar.chat', group: 'admin.operations' },
    { to: '/admin/staff', icon: Users, labelKey: 'sidebar.staff', group: 'admin.team' },
    { to: '/admin/settings', icon: Settings, labelKey: 'sidebar.settings', group: 'admin.team' },
  ],
  manager: [
    { to: '/admin/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', group: 'admin.main' },
    { to: '/admin/reception', icon: Monitor, labelKey: 'sidebar.reception', group: 'admin.main' },
    { to: '/admin/calendar', icon: CalendarDays, labelKey: 'sidebar.calendar', group: 'admin.main' },
    { to: '/admin/rooms', icon: BedDouble, labelKey: 'sidebar.rooms', group: 'admin.main' },
    { to: '/admin/bookings', icon: CalendarCheck, labelKey: 'sidebar.bookings', group: 'admin.main' },
    { to: '/admin/analytics', icon: BarChart3, labelKey: 'sidebar.analytics', group: 'admin.operations' },
    { to: '/admin/pricing', icon: Sparkles, labelKey: 'sidebar.aiPricing', group: 'admin.operations' },
    { to: '/admin/offers', icon: Tag, labelKey: 'sidebar.offers', group: 'admin.operations' },
    { to: '/admin/reviews', icon: Star, labelKey: 'sidebar.reviews', group: 'admin.operations' },
    { to: '/admin/housekeeping', icon: Home, labelKey: 'sidebar.housekeeping', group: 'admin.operations' },
    { to: '/admin/requests', icon: Bell, labelKey: 'sidebar.requests', group: 'admin.operations' },
    { to: '/admin/chat', icon: MessageSquare, labelKey: 'sidebar.chat', group: 'admin.operations' },
    { to: '/admin/staff', icon: Users, labelKey: 'sidebar.staff', group: 'admin.team' },
    { to: '/admin/settings', icon: Settings, labelKey: 'sidebar.settings', group: 'admin.team' },
  ],
  receptionist: [
    { to: '/admin/dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard', group: 'admin.main' },
    { to: '/admin/reception', icon: Monitor, labelKey: 'sidebar.reception', group: 'admin.main' },
    { to: '/admin/calendar', icon: CalendarDays, labelKey: 'sidebar.calendar', group: 'admin.main' },
    { to: '/admin/bookings', icon: CalendarCheck, labelKey: 'sidebar.bookings', group: 'admin.main' },
    { to: '/admin/housekeeping', icon: Home, labelKey: 'sidebar.housekeeping', group: 'admin.operations' },
    { to: '/admin/requests', icon: Bell, labelKey: 'sidebar.requests', group: 'admin.operations' },
    { to: '/admin/chat', icon: MessageSquare, labelKey: 'sidebar.chat', group: 'admin.operations' },
    { to: '/admin/reviews', icon: Star, labelKey: 'sidebar.reviews', group: 'admin.operations' },
  ],
};

const ROLE_CONFIG = {
  superadmin: { labelKey: 'admin.superAdmin', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  owner: { labelKey: 'admin.owner', color: S.gold, bg: S.goldDim },
  manager: { labelKey: 'admin.manager', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  receptionist: { labelKey: 'admin.receptionist', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
};

const NavItem = ({ to, icon: Icon, labelKey, collapsed, isRtl, t }) => (
  <NavLink to={to} end>
    {({ isActive }) => (
      <div className={`group relative flex items-center rounded-xl cursor-pointer transition-all duration-200 py-2 ${
        collapsed ? 'justify-center px-0' : 'px-3'
      } ${isActive ? 'bg-amber-500/10 text-amber-400' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>

        {isActive && (
          <span className="absolute top-1/2 -translate-y-1/2 h-[55%] w-[3px] bg-amber-400 rounded-r-full" style={{
            [isRtl ? 'right' : 'left']: 0,
          }} />
        )}

        <Icon className="w-[17px] h-[17px] shrink-0" />

        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18 }} className="overflow-hidden whitespace-nowrap text-[13px] font-medium" style={{
                marginLeft: isRtl ? 0 : 8,
                marginRight: isRtl ? 8 : 0,
              }}>
              {t(labelKey)}
            </motion.span>
          )}
        </AnimatePresence>

        {collapsed && (
          <span className="absolute transition-opacity duration-150 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl bg-neutral-900 text-white border border-white/10 z-50" style={{
            [isRtl ? 'right' : 'left']: 'calc(100% + 12px)',
          }}>
            {t(labelKey)}
          </span>
        )}
      </div>
    )}
  </NavLink>
);

export const AdminSidebar = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const role = useSelector(selectUserRole);
  const collapsed = useSelector(selectSidebarCollapsed);

  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.receptionist;
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.receptionist;

  const groups = navItems.reduce((acc, item) => {
    const g = item.group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success(t('admin.logoutSuccess'));
    navigate('/auth/login');
  };

  return (
    <motion.aside animate={{ width: collapsed ? 64 : 248 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="h-full flex flex-col overflow-hidden flex-shrink-0" style={{ background: S.bg }}>

      {/* Logo */}
      <div className="flex items-center h-16 px-3.5 flex-shrink-0" style={{ borderBottom: `1px solid ${S.sep}` }}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: S.gold }}>
            <Hotel style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: isRtl ? 6 : -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 6 : -6 }}
                transition={{ duration: 0.16 }} className="min-w-0 overflow-hidden">
                <p className="font-bold text-[14px] leading-tight" style={{ color: S.txtPri }}>LuxStay</p>
                <p className="text-[10px] font-semibold tracking-[0.2em]" style={{ color: S.txtFaint }}>ADMIN</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => dispatch(collapseSidebar())} className="hidden lg:flex w-6 h-6 rounded-lg items-center justify-center transition-colors" style={{ color: S.txtFaint }}
          onMouseEnter={e => e.currentTarget.style.color = S.txtMuted}
          onMouseLeave={e => e.currentTarget.style.color = S.txtFaint}>
          {collapsed ? <ChevronRight style={{ width: 14, height: 14 }} /> : <ChevronLeft style={{ width: 14, height: 14 }} />}
        </button>
      </div>

      {/* User info */}
      <div className="flex-shrink-0 px-3 py-3" style={{ borderBottom: `1px solid ${S.sep}` }}>
        <div className="flex items-center gap-2.5" style={{ justifyContent: collapsed ? 'center' : isRtl ? 'flex-end' : 'flex-start' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0" style={{ background: S.gold, color: '#fff' }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }} className="min-w-0 overflow-hidden" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: S.txtPri }}>
                  {user?.name}
                </p>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5" style={{
                  background: roleConfig.bg, color: roleConfig.color,
                }}>
                  {t(roleConfig.labelKey)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4" style={{ scrollbarWidth: 'none' }}>
        {Object.entries(groups).map(([groupLabel, items]) => (
          <div key={groupLabel}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[10px] font-bold uppercase tracking-[0.18em] px-3 mb-1.5" style={{
                    color: '#fff',
                    textAlign: isRtl ? 'right' : 'left',
                  }}>
                  {t(groupLabel)}
                </motion.p>
              )}
            </AnimatePresence>
            {collapsed && <div className="h-px mx-1 mb-2" style={{ background: S.sep }} />}
            <div className="space-y-0.5">
              {items.map(({ to, icon, labelKey }) => (
                <NavItem key={to} to={to} icon={icon} labelKey={labelKey} collapsed={collapsed} isRtl={isRtl} t={t} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 px-2 py-3" style={{ borderTop: `1px solid ${S.sep}` }}>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 rounded-xl transition-all text-[13px] font-medium" style={{
          padding: collapsed ? '9px 0' : '9px 11px',
          justifyContent: collapsed ? 'center' : isRtl ? 'flex-end' : 'flex-start',
          color: S.txtFaint,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.txtFaint; }}>
          <LogOut style={{ width: 17, height: 17, flexShrink: 0 }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden whitespace-nowrap">
                {t('admin.logout')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};