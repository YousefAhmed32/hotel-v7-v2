import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Home, RefreshCw, BedDouble, CheckCircle2, AlertTriangle, Wrench, Lock, CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { housekeepingApi } from '@/services/housekeepingApi';
import { cn } from '@/utils/cn';

const BRAND = '#f6a003';
const BRAND_LIGHT = '#fff7e6';

const STATUS_CONFIG = {
  available:   { labelKey: 'housekeeping.status_available',   color: 'bg-emerald-50 border-emerald-300 text-emerald-800', dot: 'bg-emerald-500', icon: CheckCircle2,  actions: ['maintenance', 'blocked'] },
  occupied:    { labelKey: 'housekeeping.status_occupied',    color: 'bg-blue-50 border-blue-300 text-blue-800',          dot: 'bg-blue-500',    icon: BedDouble,     actions: ['dirty', 'maintenance'] },
  dirty:       { labelKey: 'housekeeping.status_dirty',       color: 'bg-orange-50 border-orange-300 text-orange-800',    dot: 'bg-orange-500',  icon: AlertTriangle, actions: ['cleaning', 'maintenance'] },
  cleaning:    { labelKey: 'housekeeping.status_cleaning',    color: 'bg-purple-50 border-purple-300 text-purple-800',    dot: 'bg-purple-500',  icon: CircleDot,     actions: ['clean', 'dirty'] },
  clean:       { labelKey: 'housekeeping.status_clean',       color: 'bg-teal-50 border-teal-300 text-teal-800',          dot: 'bg-teal-500',    icon: CheckCircle2,  actions: ['available', 'maintenance'] },
  maintenance: { labelKey: 'housekeeping.status_maintenance', color: 'bg-red-50 border-red-300 text-red-800',             dot: 'bg-red-500',     icon: Wrench,        actions: ['available', 'dirty'] },
  blocked:     { labelKey: 'housekeeping.status_blocked',     color: 'bg-neutral-100 border-neutral-300 text-neutral-600',dot: 'bg-neutral-400', icon: Lock,          actions: ['available'] },
};

const RoomCard = ({ room, onUpdate, t }) => {
  const config = STATUS_CONFIG[room.currentStatus] || STATUS_CONFIG.available;
  const Icon = config.icon;
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const ACTION_LABELS = {
    available: t('housekeeping.markAvailable'), occupied: t('housekeeping.markOccupied'),
    dirty: t('housekeeping.markDirty'), cleaning: t('housekeeping.startCleaning'),
    clean: t('housekeeping.markClean'), maintenance: t('housekeeping.maintenanceMode'),
    blocked: t('housekeeping.blockRoom'),
  };

  const handleAction = async (status) => {
    setUpdating(true); setOpen(false);
    try { await onUpdate(room._id, status); }
    finally { setUpdating(false); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ ease: 'easeOut' }}
      className={cn('relative rounded-2xl border-2 p-4 transition-all duration-200 hover:shadow-md', config.color)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-sm leading-tight">{room.roomNumber ? `#${room.roomNumber}` : room.name}</p>
          <p className="text-xs opacity-60 capitalize mt-0.5">{room.type}{room.floor ? ` · Floor ${room.floor}` : ''}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn('w-2 h-2 rounded-full animate-pulse', config.dot)} />
          <span className="text-[11px] font-bold">{t(STATUS_CONFIG[room.currentStatus]?.labelKey || 'housekeeping.status_available')}</span>
        </div>
      </div>

      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/50 mb-3">
        <Icon className="w-4 h-4 opacity-70" />
      </div>

      {room.currentBookingId && (
        <div className="bg-white/70 rounded-xl px-3 py-2 mb-3 text-xs border border-white/80">
          <p className="font-semibold truncate">{room.currentBookingId.guestDetails?.firstName} {room.currentBookingId.guestDetails?.lastName}</p>
          <p className="opacity-60 mt-0.5">{room.currentBookingId.confirmationCode}</p>
        </div>
      )}

      {room.housekeepingNotes && (
        <p className="text-xs opacity-60 bg-white/40 rounded-lg px-2.5 py-1.5 mb-3 line-clamp-2 leading-relaxed">{room.housekeepingNotes}</p>
      )}

      <div className="relative">
        <button onClick={() => setOpen(p => !p)} disabled={updating}
          className="w-full text-xs font-bold py-2 rounded-xl bg-white/70 hover:bg-white/90 transition-all disabled:opacity-50 tracking-wide">
          {updating ? <span className="flex items-center justify-center gap-1.5">
            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            {t('housekeeping.updating')}
          </span> : `${t('housekeeping.changeStatus')} ↓`}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-neutral-100 py-2 z-50 overflow-hidden">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 pb-1.5">{t('housekeeping.changeTo')}</p>
              {config.actions.map(action => (
                <button key={action} onClick={() => handleAction(action)}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold hover:bg-neutral-50 transition-colors flex items-center gap-2.5 text-neutral-700">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_CONFIG[action]?.dot)} />
                  {ACTION_LABELS[action]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default function HousekeepingPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const [roomsRes, statsRes] = await Promise.all([
        housekeepingApi.getRoomStatuses(hotelId),
        housekeepingApi.getStats(hotelId),
      ]);
      setRooms(roomsRes.data.data.rooms || []);
      setStats(statsRes.data.data.stats || {});
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }, [hotelId, t]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (roomId, status) => {
    try {
      await housekeepingApi.updateRoomStatus(hotelId, roomId, { status });
      toast.success(t('housekeeping.updatedSuccessfully', { status: t(`housekeeping.status_${status}`) }));
      setRooms(p => p.map(r => r._id === roomId ? { ...r, currentStatus: status, lastStatusChangedAt: new Date() } : r));
      setStats(p => {
        const old = rooms.find(r => r._id === roomId)?.currentStatus;
        const n = { ...p };
        if (old) n[old] = Math.max(0, (n[old] || 0) - 1);
        n[status] = (n[status] || 0) + 1;
        return n;
      });
    } catch (err) { toast.error(err.response?.data?.message || t('housekeeping.failedUpdate')); }
  };

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.currentStatus === filter);

  const STAT_FILTERS = [
    { key: 'all', labelKey: 'common.all' },
    { key: 'available', labelKey: 'housekeeping.status_available' },
    { key: 'occupied', labelKey: 'housekeeping.status_occupied' },
    { key: 'dirty', labelKey: 'housekeeping.status_dirty' },
    { key: 'cleaning', labelKey: 'housekeeping.status_cleaning' },
    { key: 'clean', labelKey: 'housekeeping.status_clean' },
    { key: 'maintenance', labelKey: 'housekeeping.status_maintenance' },
  ];

  const urgentCount = (stats.dirty || 0) + (stats.maintenance || 0);

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: BRAND_LIGHT }}>
              <Home className="w-5 h-5" style={{ color: BRAND }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t('housekeeping.title')}</h1>
              <p className="text-neutral-400 text-sm mt-0.5">{t('housekeeping.subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {urgentCount} {t('housekeeping.needAttention')}
            </div>
          )}
          <button onClick={load} className="p-2.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:border-neutral-300 transition-all bg-white">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      {/* Quick stats */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {STAT_FILTERS.map(({ key, labelKey }) => {
          const count = key === 'all' ? rooms.length : (stats[key] || 0);
          const cfg = key === 'all' ? null : STATUS_CONFIG[key];
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)}
              className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl border transition-all text-center"
              style={active
                ? { background: BRAND, borderColor: BRAND, color: '#fff', boxShadow: '0 2px 8px rgba(246,160,3,0.35)' }
                : { background: '#fff', borderColor: '#e5e5e5', color: '#525252' }}>
              {cfg && <span className={cn('w-2.5 h-2.5 rounded-full', active ? 'bg-white' : cfg.dot)} />}
              <span className="text-lg font-bold leading-none">{count}</span>
              <span className={cn('text-[10px] font-semibold leading-tight capitalize', active ? 'text-white/80' : 'text-neutral-400')}>
                {t(labelKey)}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-100 border-t-[#f6a003] animate-spin" />
          <p className="text-sm text-neutral-400">{t('housekeeping.loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <BedDouble className="w-8 h-8 text-neutral-300" />
          </div>
          <p className="text-neutral-500 font-medium">{t('housekeeping.noMatch')}</p>
          <p className="text-neutral-400 text-sm mt-1">{t('housekeeping.tryDifferentFilter')}</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {filtered.map(room => (
            <RoomCard key={room._id} room={room} onUpdate={handleUpdate} t={t} />
          ))}
        </motion.div>
      )}
    </div>
  );
}