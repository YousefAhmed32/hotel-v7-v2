import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  DollarSign, CalendarCheck, BedDouble, TrendingUp,
  Clock, Bell, RefreshCw, Plus, Hotel, ArrowRight,
  CheckCircle, Users, Sparkles, LogIn, LogOut,
  Home, AlertTriangle,
} from 'lucide-react';
import { selectUserHotelId, selectUserRole } from '@/features/auth/authSlice';
import { formatCurrency, formatDate, formatRelative } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import api from '@/services/api';

const G = '#f6a003';
const GD = '#d98902';
const GB = '#fff8ed';
const GR = '#fde68a';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [.22, 1, .36, 1] },
});

const PALETTES = {
  gold:    { bg: '#fff8ed', border: '#fde68a', icon: G,        val: '#b45309' },
  teal:    { bg: '#f0fdf8', border: '#99f0d9', icon: '#0d9488', val: '#0f766e' },
  blue:    { bg: '#eff6ff', border: '#bfdbfe', icon: '#3b82f6', val: '#1d4ed8' },
  violet:  { bg: '#f5f3ff', border: '#ddd6fe', icon: '#7c3aed', val: '#5b21b6' },
  rose:    { bg: '#fff1f2', border: '#fecdd3', icon: '#e11d48', val: '#be123c' },
  slate:   { bg: '#f8fafc', border: '#e2e8f0', icon: '#64748b', val: '#334155' },
};

const StatCard = ({ label, value, icon: Icon, color = 'gold', sub, onClick, delay = 0, trend }) => {
  const { t } = useTranslation();
  const p = PALETTES[color] || PALETTES.gold;
  return (
    <motion.div {...fadeUp(delay)}
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 18,
        border: '1.5px solid #f0ece4',
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .2s, border-color .2s, transform .2s',
        position: 'relative', overflow: 'hidden',
      }}
      whileHover={onClick ? { y: -3, boxShadow: '0 12px 32px rgba(0,0,0,.08)', borderColor: '#e8d8b8' } : {}}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: p.bg, opacity: .7, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ padding: 10, borderRadius: 12, background: p.bg, border: `1.5px solid ${p.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 18, height: 18, color: p.icon }} />
        </div>
        {onClick && <ArrowRight style={{ width: 16, height: 16, color: '#c6a96b' }} />}
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, color: p.val, margin: '0 0 4px', lineHeight: 1, letterSpacing: '-.01em' }}>{value ?? '—'}</p>
      <p style={{ fontSize: 12, color: '#9a8e7e', margin: 0, fontWeight: 500 }}>{t(label)}</p>
      {sub && <p style={{ fontSize: 11, color: '#b0a898', margin: '4px 0 0' }}>{t(sub)}</p>}
    </motion.div>
  );
};

const STATUS_STYLES = {
  pending:     { bg: '#fefce8', color: '#a16207', border: '#fde68a' },
  confirmed:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  checked_in:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  cancelled:   { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  checked_out: { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe' },
  no_show:     { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

const BookingStatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize', letterSpacing: '.01em',
    }}>
      {t(`booking.status_${status}`)}
    </span>
  );
};

const ALERT_STYLES = {
  yellow: { bg: '#fefce8', border: '#fde68a', icon: '#a16207', text: '#854d0e', sub: '#a16207' },
  orange: { bg: '#fff7ed', border: '#fed7aa', icon: '#c2410c', text: '#9a3412', sub: '#c2410c' },
  purple: { bg: '#f5f3ff', border: '#ddd6fe', icon: '#7c3aed', text: '#4c1d95', sub: '#7c3aed' },
};

const AlertBanner = ({ icon: Icon, titleKey, subtitleKey, onClick, color = 'yellow', delay = 0, count = 0 }) => {
  const { t } = useTranslation();
  const s = ALERT_STYLES[color];
  const title = t(titleKey, { count });
  const subtitle = t(subtitleKey);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: .35 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '13px 16px',
        background: s.bg, border: `1.5px solid ${s.border}`,
        borderRadius: 14, cursor: 'pointer',
        transition: 'opacity .15s, transform .1s',
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: .99 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 17, height: 17, color: s.icon }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: s.text, margin: '0 0 2px' }}>{title}</p>
        <p style={{ fontSize: 11, color: s.sub, margin: 0 }}>{subtitle}</p>
      </div>
      <ArrowRight style={{ width: 15, height: 15, color: s.icon, flexShrink: 0 }} />
    </motion.div>
  );
};

const ROOM_SEGMENTS = [
  { key: 'occupied',    labelKey: 'dashboard.roomOccupied',    color: '#3b82f6', dot: '#3b82f6' },
  { key: 'available',   labelKey: 'dashboard.roomAvailable',   color: '#10b981', dot: '#10b981' },
  { key: 'dirty',       labelKey: 'dashboard.roomDirty',       color: '#f59e0b', dot: '#f59e0b' },
  { key: 'maintenance', labelKey: 'dashboard.roomMaintenance', color: '#ef4444', dot: '#ef4444' },
];

const RoomStatusBar = ({ rooms }) => {
  const { t } = useTranslation();
  return (
    <motion.div {...fadeUp(0.4)}
      style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0ece4', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2a2218', margin: 0 }}>{t('dashboard.roomStatus')}</h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#2a2218' }}>{rooms.total}</span>
          <span style={{ fontSize: 12, color: '#9a8e7e' }}>{t('dashboard.totalRooms')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: '#f0ece4', gap: 2, marginBottom: 16 }}>
        {rooms.total > 0 && ROOM_SEGMENTS.filter(s => rooms[s.key] > 0).map(s => (
          <div key={s.key} style={{ height: '100%', background: s.color, borderRadius: 999, flex: rooms[s.key] / rooms.total, transition: 'flex .5s ease', minWidth: 4 }} title={`${t(s.labelKey)}: ${rooms[s.key]}`} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {ROOM_SEGMENTS.map(({ key, labelKey, dot }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#faf8f5', borderRadius: 12 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#2a2218', margin: 0, lineHeight: 1 }}>{rooms[key] ?? 0}</p>
              <p style={{ fontSize: 10, color: '#9a8e7e', margin: '3px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t(labelKey)}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, textAlign: 'right' }}>
        <Link to="/admin/housekeeping" style={{ fontSize: 12, fontWeight: 700, color: G, textDecoration: 'none' }}>
          {t('dashboard.manageHousekeeping')} →
        </Link>
      </div>
    </motion.div>
  );
};

const RecentBookings = ({ bookings }) => {
  const { t } = useTranslation();
  return (
    <motion.div {...fadeUp(0.5)}
      style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #f0ece4', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #f5f0e8' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#2a2218', margin: 0 }}>{t('dashboard.recentBookings')}</h3>
        <Link to="/admin/bookings" style={{ fontSize: 12, fontWeight: 700, color: G, textDecoration: 'none' }}>View all →</Link>
      </div>

      <div>
        {bookings.map((b, i) => (
          <motion.div
            key={b._id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.04 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px',
              borderBottom: i < bookings.length - 1 ? '1px solid #faf8f5' : 'none',
              transition: 'background .15s', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fffbf4'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: GB, border: `1.5px solid ${GR}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: GD,
            }}>
              {(b.userId?.name || 'G')[0].toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: G, fontFamily: 'monospace' }}>{b.confirmationCode}</span>
                <BookingStatusBadge status={b.status} />
              </div>
              <p style={{ fontSize: 13, color: '#4a3f30', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {b.userId?.name || t('dashboard.guest')} · {b.roomId?.name || t('dashboard.room')}
              </p>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#2a2218', margin: '0 0 3px' }}>{formatCurrency(b.pricing?.totalAmount)}</p>
              <p style={{ fontSize: 11, color: '#b0a898', margin: 0 }}>
                {formatDate(b.checkIn, 'MMM d')} → {formatDate(b.checkOut, 'MMM d')}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const hotelId  = useSelector(selectUserHotelId);
  const role     = useSelector(selectUserRole);
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const load = useCallback(async () => {
    if (!hotelId) return;
    try {
      setLoading(true); setSpinning(true);
      const { data: res } = await api.get(`/hotels/${hotelId}/dashboard`);
      setData(res.data);
    } catch (err) { console.error('Dashboard error:', err); }
    finally { setLoading(false); setTimeout(() => setSpinning(false), 600); }
  }, [hotelId]);

  useEffect(() => {
    if (hotelId) load();
  }, [hotelId]);

  if (!hotelId && role !== 'superadmin') return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, background: GB, border: `1.5px solid ${GR}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Hotel style={{ width: 38, height: 38, color: G }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#2a2218', marginBottom: 8 }}>{t('dashboard.noHotelYet')}</h2>
        <p style={{ fontSize: 14, color: '#9a8e7e', marginBottom: 24 }}>{t('dashboard.setupProperty')}</p>
        <Link to="/admin/setup" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px', borderRadius: 14,
          background: `linear-gradient(135deg,${G},${GD})`,
          color: '#fff', fontSize: 14, fontWeight: 700,
          textDecoration: 'none', boxShadow: '0 4px 16px rgba(246,160,3,.28)',
        }}>
          <Plus style={{ width: 18, height: 18 }} /> {t('dashboard.createHotel')}
        </Link>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <LoadingSpinner size="xl" />
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#9a8e7e', fontSize: 14 }}>
      {t('errors.failedLoadDashboard')}
    </div>
  );

  const { rooms, bookings, revenue, pendingRequests, recentBookings } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 0' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2a2218', margin: '0 0 4px' }}>{t('dashboard.title')}</h1>
          <p style={{ fontSize: 12, color: '#b0a898', margin: 0 }}>
            {t('dashboard.liveOverview')} — {new Date().toLocaleDateString(t('_lang') === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={load}
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: '1.5px solid #ede8df', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'border-color .15s, color .15s',
            color: '#9a8e7e', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede8df'; e.currentTarget.style.color = '#9a8e7e'; }}
          title="Refresh"
        >
          <RefreshCw style={{ width: 15, height: 15, animation: spinning ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ height: 2, borderRadius: 999, background: `linear-gradient(90deg,${G},${GR},transparent)` }} />

      {(bookings.pendingApprovals > 0 || pendingRequests > 0 || rooms.dirty > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bookings.pendingApprovals > 0 && (
            <AlertBanner icon={Bell} color="yellow" delay={0}
              titleKey="dashboard.bookingsWaiting"
              subtitleKey="dashboard.clickToReview"
              count={bookings.pendingApprovals}
              onClick={() => navigate('/admin/bookings?status=pending')} />
          )}
          {pendingRequests > 0 && (
            <AlertBanner icon={AlertTriangle} color="orange" delay={0.05}
              titleKey="dashboard.requestsPending"
              subtitleKey="dashboard.roomService"
              count={pendingRequests}
              onClick={() => navigate('/admin/requests')} />
          )}
          {rooms.dirty > 0 && (
            <AlertBanner icon={Home} color="purple" delay={0.1}
              titleKey="dashboard.roomsNeedCleaning"
              subtitleKey="dashboard.updateHousekeeping"
              count={rooms.dirty}
              onClick={() => navigate('/admin/housekeeping')} />
          )}
        </div>
      )}

      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#7c6f5a', marginBottom: 12 }}>
          {t('dashboard.revenue')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14 }}>
          <StatCard
            label="dashboard.revenueToday"
            value={formatCurrency(revenue.today)}
            icon={DollarSign}
            color="gold"
            delay={0}
          />
          <StatCard
            label="dashboard.revenueMonth"
            value={formatCurrency(revenue.thisMonth)}
            icon={TrendingUp}
            color="teal"
            delay={0.05}
          />
          <StatCard
            label="dashboard.activeBookings"
            value={bookings.active}
            icon={CalendarCheck}
            color="blue"
            delay={0.1}
            onClick={() => navigate('/admin/bookings?status=confirmed')}
          />
          <StatCard
            label="dashboard.pendingApproval"
            value={bookings.pendingApprovals}
            icon={Bell}
            color="rose"
            delay={0.15}
            onClick={() => navigate('/admin/bookings?status=pending')}
          />
        </div>
      </div>

      <div>
        <p style={{ fontSize: 12, fontWeight: 800, color: '#7c6f5a', marginBottom: 12 }}>
          {t('dashboard.todayOperations')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatCard
            label="dashboard.checkInsToday"
            value={bookings.todayCheckins}
            icon={LogIn}
            color="blue"
            delay={0.2}
            onClick={() => navigate('/admin/bookings?status=confirmed')}
          />
          <StatCard
            label="dashboard.checkOutsToday"
            value={bookings.todayCheckouts}
            icon={LogOut}
            color="violet"
            delay={0.25}
            onClick={() => navigate('/admin/bookings?status=checked_in')}
          />
          <StatCard
            label="dashboard.guestRequests"
            value={pendingRequests}
            icon={Bell}
            color="gold"
            delay={0.3}
            onClick={() => navigate('/admin/requests')}
          />
          <StatCard
            label="dashboard.dirtyRooms"
            value={rooms.dirty}
            icon={Home}
            color="slate"
            delay={0.35}
            onClick={() => navigate('/admin/housekeeping')}
          />
        </div>
      </div>

      <RoomStatusBar rooms={rooms} />

      {recentBookings?.length > 0 && <RecentBookings bookings={recentBookings} />}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}