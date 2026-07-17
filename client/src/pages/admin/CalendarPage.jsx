import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, BedDouble, CalendarDays, X } from 'lucide-react';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { formatDate, formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import api from '@/services/api';

const G = { 500: '#f6a003', 600: '#e09002', 50: '#fff8ed', 200: '#fde08a', ring: 'rgba(246,160,3,0.20)' };

const STATUS = {
  pending:     { bar: 'bg-yellow-400',  pill: 'bg-yellow-100 text-yellow-800 border-yellow-200',  labelKey: 'booking.status_pending' },
  confirmed:   { bar: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-800 border-emerald-200',labelKey: 'booking.status_confirmed' },
  checked_in:  { bar: 'bg-blue-500',    pill: 'bg-blue-100 text-blue-800 border-blue-200',        labelKey: 'booking.status_checked_in' },
  checked_out: { bar: 'bg-violet-400',  pill: 'bg-violet-100 text-violet-800 border-violet-200',  labelKey: 'booking.status_checked_out' },
  cancelled:   { bar: 'bg-neutral-300', pill: 'bg-neutral-100 text-neutral-500 border-neutral-200',labelKey: 'booking.status_cancelled' },
};

const getDays = (start, count) => Array.from({ length: count }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });

const BookingBlock = ({ booking, colStart, colSpan, onClick }) => {
  const { t } = useTranslation();
  const cfg = STATUS[booking.status] || STATUS.confirmed;
  const name = booking.userId?.name || booking.guestDetails?.firstName || t('dashboard.guest');

  return (
    <motion.button initial={{ opacity: 0, scaleX: 0.85 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.2 }}
      className={cn('absolute top-1.5 bottom-1.5 rounded-xl border cursor-pointer flex items-center px-2.5 overflow-hidden z-10 text-left hover:z-20 transition-all group', booking.status === 'cancelled' ? 'opacity-50' : '')}
      style={{
        left: `calc(${colStart} * var(--cell-w) + 2px)`,
        width: `calc(${colSpan} * var(--cell-w) - 8px)`,
        background: booking.status === 'cancelled' ? '#f5f5f5' : 'white',
        borderColor: booking.status === 'cancelled' ? '#d4d4d4' : 'transparent',
        boxShadow: booking.status !== 'cancelled' ? '0 1px 4px rgba(0,0,0,0.10), 0 0 0 1.5px rgba(0,0,0,0.06)' : 'none',
      }}
      onClick={e => { e.stopPropagation(); onClick(booking); }}
      title={`${name} · ${booking.confirmationCode}`}
    >
      <div className={cn('w-1 self-stretch rounded-l-xl flex-shrink-0 -ml-2.5 mr-2', cfg.bar)} />
      <span className="text-xs font-semibold text-neutral-700 truncate group-hover:text-neutral-900 transition-colors">{name}</span>
    </motion.button>
  );
};

const BookingPopup = ({ booking, onClose, t }) => {
  const cfg = STATUS[booking.status] || STATUS.confirmed;
  const name = booking.userId?.name || booking.guestDetails?.firstName || t('dashboard.guest');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={e => e.stopPropagation()} className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl text-white font-black text-lg flex items-center justify-center flex-shrink-0" style={{ background: G[500] }}>
              {name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-neutral-900">{name}</p>
              <p className="text-xs font-mono text-neutral-400">{booking.confirmationCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border capitalize', cfg.pill)}>
              {t(cfg.labelKey)}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: t('booking.room'), value: booking.roomId?.name },
              { label: t('booking.guests'), value: `${booking.adults} ${t('common.adult')}${booking.adults>1?'s':''}` },
              { label: t('calendar.checkIn'), value: formatDate(booking.checkIn, 'EEE, MMM d') },
              { label: t('calendar.checkOut'), value: formatDate(booking.checkOut, 'EEE, MMM d') },
              { label: t('calendar.nights'), value: `${booking.nights} ${t('common.night')}${booking.nights>1?'s':''}` },
              { label: t('booking.total'), value: formatCurrency(booking.pricing?.totalAmount) },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="bg-neutral-50 rounded-2xl p-3 border border-neutral-100">
                <p className="text-[10px] text-neutral-400 uppercase tracking-wide font-bold">{label}</p>
                <p className="text-sm font-semibold text-neutral-800 mt-1">{value}</p>
              </div>
            ))}
          </div>

          {booking.paymentStatus && (
            <div className={cn('flex items-center justify-between p-3 rounded-2xl border text-sm',
              booking.paymentStatus === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-[#fff8ed] border-[#fde08a]')}>
              <span className="text-neutral-500 text-xs">{t('booking.paymentStatus')}</span>
              <span className={cn('font-bold capitalize text-xs', booking.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-[#b45309]')}>
                {booking.paymentStatus}
              </span>
            </div>
          )}

          <a href={`/admin/bookings?search=${booking.confirmationCode}`} className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white text-sm font-bold transition-all"
            style={{ background: `linear-gradient(135deg, ${G[500]}, ${G[600]})`, boxShadow: `0 3px 12px ${G.ring}` }}>
            {t('calendar.openFullBooking')} ↗
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default function CalendarPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 3); return d; });
  const [days, setDays] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const DAYS_SHOWN = 30;

  useEffect(() => { setDays(getDays(startDate, DAYS_SHOWN)); }, [startDate]);

  const load = useCallback(async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const end = new Date(startDate); end.setDate(end.getDate() + DAYS_SHOWN);
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get(`/hotels/${hotelId}/rooms`, { params: { limit: 100, isActive: 'all' } }),
        api.get(`/hotels/${hotelId}/bookings`, { params: { limit: 200, from: startDate.toISOString().split('T')[0], to: end.toISOString().split('T')[0] } }),
      ]);
      setRooms(roomsRes.data.data || []);
      setBookings(bookingsRes.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [hotelId, startDate]);

  useEffect(() => { load(); }, [load]);

  const prevPeriod = () => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d); };
  const nextPeriod = () => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d); };
  const goToday = () => { const d = new Date(); d.setDate(d.getDate() - 3); setStartDate(d); };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const getBookingSpan = (booking) => {
    const bStart = new Date(booking.checkIn); bStart.setHours(0, 0, 0, 0);
    const bEnd = new Date(booking.checkOut); bEnd.setHours(0, 0, 0, 0);
    const gStart = new Date(startDate); gStart.setHours(0, 0, 0, 0);
    const gEnd = new Date(startDate); gEnd.setDate(gEnd.getDate() + DAYS_SHOWN); gEnd.setHours(0, 0, 0, 0);

    if (bEnd <= gStart || bStart >= gEnd) return null;
    const colStart = Math.max(0, Math.round((bStart - gStart) / 86400000));
    const colEnd = Math.min(DAYS_SHOWN, Math.round((bEnd - gStart) / 86400000));
    const colSpan = colEnd - colStart;
    return colSpan > 0 ? { colStart, colSpan } : null;
  };

  const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];

  const filteredRooms = rooms.filter(room => {
    if (filter === 'all') return true;
    const rBookings = bookings.filter(b => (b.roomId?._id === room._id || b.roomId === room._id));
    return rBookings.some(b => b.status === filter);
  });

  const ROOM_STATUS_DOT = {
    available: 'bg-emerald-500', occupied: 'bg-blue-500', dirty: 'bg-orange-400',
    cleaning: 'bg-violet-500', maintenance: 'bg-red-500', blocked: 'bg-neutral-400',
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: G[50] }}>
              <CalendarDays className="w-4.5 h-4.5" style={{ color: G[500] }} />
            </div>
            <div>
              <h1 className="text-xl font-black text-neutral-900">{t('calendar.title')}</h1>
              <p className="text-xs text-neutral-400">{t('calendar.subtitle', { rooms: rooms.length, days: DAYS_SHOWN })}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-100 mr-1">
            {Object.entries(STATUS).map(([s, cfg]) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn('w-2.5 h-2.5 rounded-sm', cfg.bar)} />
                <span className="text-xs text-neutral-400">{t(cfg.labelKey)}</span>
              </div>
            ))}
          </div>

          <button onClick={goToday} className="px-3.5 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:border-[#f6a003]/50 hover:text-[#f6a003] hover:bg-[#fff8ed] transition-all">
            {t('calendar.today')}
          </button>
          <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
            <button onClick={prevPeriod} className="p-2 hover:bg-neutral-50 text-neutral-500 hover:text-[#f6a003] transition-colors border-r border-neutral-200">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-neutral-600">
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {days[days.length - 1]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button onClick={nextPeriod} className="p-2 hover:bg-neutral-50 text-neutral-500 hover:text-[#f6a003] transition-colors border-l border-neutral-200">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={load} className="p-2.5 rounded-xl border border-neutral-200 hover:border-[#f6a003]/50 text-neutral-400 hover:text-[#f6a003] transition-all">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {STATUS_FILTERS.map(s => {
          const cfg = s !== 'all' ? STATUS[s] : null;
          const active = filter === s;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 capitalize',
                active ? 'text-white border-transparent' : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300')}
              style={active ? { background: G[500] } : {}}>
              {cfg && <span className={cn('w-2 h-2 rounded-sm', active ? 'bg-white/60' : cfg.bar)} />}
              {s === 'all' ? t('calendar.allRooms') : t(cfg.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-[#f6a003] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto scrollbar-thin" style={{ '--cell-w': '110px', maxHeight: 'calc(100vh - 280px)' }}>
            <div style={{ minWidth: `calc(200px + ${DAYS_SHOWN} * var(--cell-w))` }}>

              {/* Date header */}
              <div className="flex border-b border-neutral-200 bg-neutral-50/90 sticky top-0 z-30 backdrop-blur-sm">
                <div className="w-48 flex-shrink-0 px-4 py-3 border-r border-neutral-200 sticky left-0 bg-neutral-50/95 z-10">
                  <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">{t('calendar.room')}</p>
                </div>
                {days.map((day, i) => {
                  const isToday = day.toDateString() === today.toDateString();
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <div key={i} className={cn('flex-shrink-0 text-center py-2.5 border-r border-neutral-100 transition-colors', isToday && 'bg-[#fff8ed]', isWeekend && !isToday && 'bg-neutral-50/50')} style={{ width: 'var(--cell-w)' }}>
                      <p className={cn('text-[10px] font-black uppercase tracking-wide', isToday ? 'text-[#f6a003]' : 'text-neutral-400')}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className={cn('text-sm font-black mt-0.5', isToday ? 'text-[#f6a003]' : 'text-neutral-700')}>
                        {day.getDate()}
                      </p>
                      {isToday && <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ background: G[500] }} />}
                    </div>
                  );
                })}
              </div>

              {/* Rooms */}
              {filteredRooms.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                      <BedDouble className="w-8 h-8 text-neutral-300" />
                    </div>
                    <p className="text-neutral-400 font-medium">{t('calendar.noRooms')}</p>
                  </div>
                </div>
              ) : filteredRooms.map((room, ri) => {
                const rBookings = bookings.filter(b => (b.roomId?._id === room._id || b.roomId === room._id) && (filter === 'all' || b.status === filter));
                const statusDot = ROOM_STATUS_DOT[room.currentStatus] || 'bg-neutral-300';

                return (
                  <div key={room._id} className={cn('flex border-b border-neutral-100 group hover:bg-neutral-50/40 transition-colors', ri % 2 === 0 ? 'bg-white' : 'bg-neutral-50/20')}>
                    <div className="w-48 flex-shrink-0 px-4 py-0 border-r border-neutral-100 flex items-center gap-2.5 sticky left-0 z-10 bg-inherit">
                      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', statusDot)} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-neutral-800 truncate">{room.name}</p>
                        <p className="text-[11px] text-neutral-400 capitalize">
                          {room.type}{room.roomNumber ? ' · #' + room.roomNumber : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 relative" style={{ height: '56px' }}>
                      <div className="flex h-full">
                        {days.map((day, di) => {
                          const isToday = day.toDateString() === today.toDateString();
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          return (
                            <div key={di} className={cn('flex-shrink-0 border-r border-neutral-100 h-full', isToday && 'bg-[#fff8ed]/60', isWeekend && !isToday && 'bg-neutral-50/60')} style={{ width: 'var(--cell-w)' }} />
                          );
                        })}
                      </div>

                      {(() => {
                        const gridStart = new Date(startDate); gridStart.setHours(0, 0, 0, 0);
                        const todayCol = Math.round((today - gridStart) / 86400000);
                        if (todayCol >= 0 && todayCol < DAYS_SHOWN) {
                          return (
                            <div className="absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none"
                              style={{ left: `calc(${todayCol} * var(--cell-w) + var(--cell-w)/2)`, background: G[500], opacity: 0.4 }} />
                          );
                        }
                        return null;
                      })()}

                      {rBookings.map(booking => {
                        const span = getBookingSpan(booking);
                        if (!span) return null;
                        return <BookingBlock key={booking._id} booking={booking} colStart={span.colStart} colSpan={span.colSpan} onClick={setSelected} />;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popup */}
      <AnimatePresence>
        {selected && <BookingPopup booking={selected} onClose={() => setSelected(null)} t={t} />}
      </AnimatePresence>
    </div>
  );
}