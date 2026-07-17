// ============================================================================
// PART 1: RequestsPage
// ============================================================================
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, RefreshCw, CheckCircle2, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatRelative } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import api from '@/services/api';

const BRAND = '#f6a003';
const BRAND_LIGHT = '#fff7e6';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: 'bg-yellow-50 text-yellow-800 border-yellow-200',   dot: 'bg-yellow-400' },
  acknowledged: { label: 'Acknowledged', color: 'bg-blue-50 text-blue-800 border-blue-200',         dot: 'bg-blue-400' },
  in_progress:  { label: 'In Progress',  color: 'bg-purple-50 text-purple-800 border-purple-200',   dot: 'bg-purple-500' },
  completed:    { label: 'Done',         color: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:    { label: 'Cancelled',    color: 'bg-neutral-100 text-neutral-500 border-neutral-200',dot: 'bg-neutral-300' },
};

export default function RequestsPage() {
    const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');

  const load = useCallback(async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/hotels/${hotelId}/requests`, { params: { status: filter || undefined, limit: 50 } });
      setRequests(data.data || []);
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }, [hotelId, filter, t]);

  useEffect(() => { load(); }, [load]);

  const FILTERS = [
    { value: '',            label: t('common.all') },
    { value: 'pending',     label: t('requests.pending') },
    { value: 'acknowledged',label: t('requests.acknowledged') },
    { value: 'in_progress', label: t('requests.inProgress') },
    { value: 'completed',   label: t('requests.completed') },
  ];

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 px-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ background: BRAND_LIGHT }}>
            <Bell className="w-5 h-5" style={{ color: BRAND }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t('requests.title')}</h1>
            <p className="text-neutral-400 text-sm mt-0.5">{t('requests.subtitle')}</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {pendingCount} {t('requests.pending')}
          </div>
        )}
        <button onClick={load} className="p-2.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-neutral-700 transition-all bg-white">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => {
          const count = value === '' ? requests.length : requests.filter(r => r.status === value).length;
          const active = filter === value;
          return (
            <button key={value} onClick={() => setFilter(value)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
              style={active ? { background: BRAND, borderColor: BRAND, color: '#fff', boxShadow: '0 2px 8px rgba(246,160,3,0.3)' }
                : { background: '#fff', borderColor: '#e5e5e5', color: '#525252' }}>
              {label}
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={active ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: '#f5f5f5', color: '#737373' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-100 border-t-[#f6a003] animate-spin" />
          <p className="text-sm text-neutral-400">{t('requests.loading')}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-20 text-center">
          <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 font-medium">{t('requests.noFound')}</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {requests.map((req, i) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              return (
                <motion.div key={req._id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: BRAND_LIGHT }}>
                        🔔
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="font-bold text-neutral-900 text-sm">{req.title}</p>
                          <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold border', cfg.color)}>
                            <span className={cn('w-1.5 h-1.5 rounded-full inline-block mr-1.5', cfg.dot)} />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-2">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{req.guestId?.name || 'Guest'}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelative(req.createdAt)}</span>
                        </div>
                        {req.description && (
                          <p className="text-sm text-neutral-500 bg-neutral-50 rounded-xl px-3.5 py-2.5 leading-relaxed border border-neutral-100">
                            {req.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ============================================================================
// PART 2: ReviewsPage (minimal)
// ============================================================================
export function ReviewsPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) return;
    api.get(`/hotels/${hotelId}/admin/reviews`, { params: { limit: 20 } })
      .then(({ data }) => setReviews(data.data || []))
      .catch(() => toast.error(t('errors.loadFailed')))
      .finally(() => setLoading(false));
  }, [hotelId, t]);

  return (
    <div className="space-y-6 px-1">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('reviews.title')}</h1>
          <p className="text-neutral-400 text-sm mt-0.5">{reviews.length} {t('reviews.total')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="xl" /></div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-20 text-center">
          <p className="text-neutral-400">{t('reviews.noReviews')}</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {reviews.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900">{r.userId?.name || 'Guest'}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{r.title}</p>
                    <p className="text-sm text-neutral-600 mt-2">{r.comment}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold" style={{ color: BRAND }}>{'★'.repeat(r.rating)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ============================================================================
// PART 3: RoomsPage (simplified)
// ============================================================================
export function RoomsPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!hotelId) return;
    api.get(`/hotels/${hotelId}/rooms`, { params: { limit: 100 } })
      .then(({ data }) => setRooms(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hotelId]);

  const filtered = rooms.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('rooms.title')}</h1>
          <p className="text-neutral-400 text-sm mt-1">{rooms.length} {t('rooms.total')}</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('common.search')}
          className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 outline-none focus:border-[#f6a003] focus:ring-2 transition-all" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="xl" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-20 text-center">
          <p className="text-neutral-400">{t('rooms.noRooms')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(room => (
            <motion.div key={room._id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-neutral-900">{room.name || `Room ${room.roomNumber}`}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 capitalize">{room.type}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <span className="text-xs text-neutral-500">{t('common.price')}</span>
                <span className="text-sm font-bold" style={{ color: '#f6a003' }}>${room.basePrice}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}