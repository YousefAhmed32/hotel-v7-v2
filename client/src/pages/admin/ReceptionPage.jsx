import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { BedDouble, LogIn, LogOut, RefreshCw, Search, AlertTriangle, Sparkles, Plus, Clock, Check, Zap, ChevronDown, CalendarDays, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { housekeepingApi } from '@/services/housekeepingApi';
import { bookingApi } from '@/services/bookingApi';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import api from '@/services/api';

const G = { 500: '#f6a003', 600: '#e09200', 50: '#fff8ed', 100: '#fef3d0', 200: '#fde08a', text: '#b45309', ring: 'rgba(246,160,3,0.25)' };

const S = {
  available:   { bg: 'bg-emerald-500',  light: 'bg-emerald-50',   border: 'border-emerald-200',  text: 'text-emerald-700',  dot: 'bg-emerald-500',  label: 'Available' },
  occupied:    { bg: 'bg-blue-500',     light: 'bg-blue-50',      border: 'border-blue-200',     text: 'text-blue-700',     dot: 'bg-blue-500',     label: 'Occupied' },
  dirty:       { bg: 'bg-orange-400',   light: 'bg-orange-50',    border: 'border-orange-200',   text: 'text-orange-700',   dot: 'bg-orange-400',   label: 'Dirty' },
  cleaning:    { bg: 'bg-purple-500',   light: 'bg-purple-50',    border: 'border-purple-200',   text: 'text-purple-700',   dot: 'bg-purple-500',   label: 'Cleaning' },
  clean:       { bg: 'bg-teal-500',     light: 'bg-teal-50',      border: 'border-teal-200',     text: 'text-teal-700',     dot: 'bg-teal-500',     label: 'Clean' },
  maintenance: { bg: 'bg-red-500',      light: 'bg-red-50',       border: 'border-red-200',      text: 'text-red-700',      dot: 'bg-red-500',      label: 'Maint.' },
  blocked:     { bg: 'bg-neutral-400',  light: 'bg-neutral-100',  border: 'border-neutral-200',  text: 'text-neutral-600',  dot: 'bg-neutral-400', label: 'Blocked' },
};

const Countdown = ({ checkOut, compact }) => {
  const [rem, setRem] = useState('');
  useEffect(() => {
    const calc = () => {
      const ms = new Date(checkOut) - new Date();
      if (ms <= 0) { setRem('OVERDUE'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      if (Math.floor(h / 24) > 0) setRem(`${Math.floor(h/24)}d ${h%24}h`);
      else if (h > 0) setRem(`${h}h ${m}m`);
      else setRem(`${m}m`);
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [checkOut]);

  const overdue = rem === 'OVERDUE';
  if (compact) return <span className={cn('font-mono text-[11px] font-bold', overdue ? 'text-red-600' : 'text-neutral-400')}>{rem}</span>;
  return <span className={cn('inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full', overdue ? 'bg-red-100 text-red-600' : 'bg-neutral-100 text-neutral-500')}><Clock className="w-3 h-3" />{rem}</span>;
};

const RoomCard = ({ room, isHighlighted, onClick }) => {
  const { t } = useTranslation();
  const cfg = S[room.currentStatus] || S.available;
  const guest = room.currentBookingId;
  const overdue = guest?.checkOut && new Date(guest.checkOut) < new Date();

  return (
    <motion.button layout onClick={onClick} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      className={cn('relative text-left rounded-2xl border p-3.5 transition-all duration-150 w-full overflow-hidden',
        cfg.light, cfg.border, isHighlighted && 'ring-2 ring-[#f6a003] ring-offset-2', overdue && 'ring-2 ring-red-400 ring-offset-1')}>
      <div className={cn('absolute top-0 left-0 right-0 h-1 rounded-t-2xl', cfg.bg)} />
      <div className="flex items-start justify-between mb-2.5 mt-1">
        <div>
          <p className="font-black text-neutral-900 text-base leading-none">{room.roomNumber ? '#' + room.roomNumber : room.name}</p>
          <p className="text-[11px] text-neutral-400 capitalize mt-0.5">{room.type}</p>
        </div>
        <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1', cfg.dot, room.currentStatus === 'occupied' && !overdue && 'animate-pulse')} />
      </div>
      <p className={cn('text-[11px] font-black uppercase tracking-wider', cfg.text)}>{cfg.label}</p>
      {guest && (
        <div className="mt-2.5 pt-2.5 border-t border-black/5">
          <p className="text-xs font-semibold text-neutral-700 truncate">{guest.guestDetails?.firstName || guest.userId?.name || 'Guest'}</p>
          <Countdown checkOut={guest.checkOut} compact />
        </div>
      )}
      {overdue && <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg rounded-tr-2xl">LATE</div>}
    </motion.button>
  );
};

const StatChip = ({ label, value, color, onClick, urgent }) => (
  <button onClick={onClick}
    className={cn('flex items-center gap-2 px-3.5 py-2 rounded-2xl border font-medium text-sm transition-all',
      urgent ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' : 'bg-white border-neutral-200 text-neutral-700 hover:border-[#f6a003]/50 hover:bg-[#fff8ed]')}>
    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', color)} />
    <span className="font-black text-lg leading-none">{value}</span>
    <span className="text-xs text-neutral-400 hidden sm:block">{label}</span>
  </button>
);

export default function ReceptionPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!hotelId) return;
    try {
      if (!rooms.length) setLoading(true);
      const { data } = await housekeepingApi.getRoomStatuses(hotelId);
      setRooms(data.data.rooms || []);
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }, [hotelId]);

  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);

  const filtered = useMemo(() => filter === 'all' ? rooms : rooms.filter(r => r.currentStatus === filter), [rooms, filter]);
  const counts = useMemo(() => rooms.reduce((acc, r) => { acc[r.currentStatus] = (acc[r.currentStatus] || 0) + 1; return acc; }, {}), [rooms]);

  const overdueCount = rooms.filter(r => r.currentStatus === 'occupied' && r.currentBookingId?.checkOut && new Date(r.currentBookingId.checkOut) < new Date()).length;
  const dirtyCount = counts.dirty || 0;

  const FILTERS = [
    { id: 'all', label: 'All', count: rooms.length },
    { id: 'available', label: 'Free', count: counts.available || 0 },
    { id: 'occupied', label: 'Occupied', count: counts.occupied || 0 },
    { id: 'dirty', label: 'Dirty', count: dirtyCount },
  ];

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-neutral-900">{t('reception.title')}</h1>
          <p className="text-neutral-400 text-xs hidden sm:block">{rooms.length} {t('reception.rooms')} · auto-refresh 60s</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-neutral-200 hover:border-[#f6a003]/50 text-neutral-400 hover:text-[#f6a003] transition-all flex-shrink-0">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatChip label={t('reception.available')} value={counts.available || 0} color="bg-emerald-500" onClick={() => setFilter('available')} />
        <StatChip label={t('reception.occupied')} value={counts.occupied || 0} color="bg-blue-500" onClick={() => setFilter('occupied')} />
        <StatChip label={t('reception.dirty')} value={dirtyCount} color="bg-orange-400" onClick={() => setFilter('dirty')} />
        {overdueCount > 0 && <StatChip label={t('reception.overdue')} value={overdueCount} color="bg-red-500" onClick={() => setFilter('occupied')} urgent />}
      </div>

      {overdueCount > 0 && (
        <button onClick={() => setFilter('occupied')} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold hover:bg-red-100 transition-colors">
          <AlertTriangle className="w-3.5 h-3.5" /> {overdueCount} {t('reception.overdueCheckout')}
        </button>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-shrink-0">
        {FILTERS.map(f => {
          const cfg = f.id !== 'all' ? S[f.id] : null;
          const active = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0',
                active ? 'text-white border-transparent shadow-sm' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300')}
              style={active ? { background: '#f6a003' } : {}}>
              {cfg && <span className={cn('w-2 h-2 rounded-full', active ? 'bg-white/60' : cfg.dot)} />}
              {f.label}
              <span className={cn('text-[10px] font-black min-w-[16px] text-center', active ? 'opacity-80' : 'text-neutral-400')}>{f.count}</span>
            </button>
          );
        })}
      </div>

      {loading && !rooms.length ? (
        <div className="flex justify-center py-20 flex-1">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#f6a003] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <BedDouble className="w-8 h-8 text-neutral-300" />
            </div>
            <p className="text-neutral-400 font-medium">{t('reception.noMatch')}</p>
          </div>
        </div>
      ) : (
        <motion.div layout className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          <AnimatePresence>
            {filtered.map(room => (
              <RoomCard key={room._id} room={room} isHighlighted={false} onClick={() => toast.success(`Selected ${room.roomNumber || room.name}`)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}