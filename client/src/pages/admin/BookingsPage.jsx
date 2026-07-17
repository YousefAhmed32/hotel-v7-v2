import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  CalendarCheck, Search, X, RefreshCw,
  CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, DollarSign, FileText, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUserHotelId, selectUserRole } from '@/features/auth/authSlice';
import { bookingApi } from '@/services/bookingApi';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const STATUS_CONFIG = {
  locked:      { labelKey: 'booking.status_locked',       dot: 'bg-neutral-400',  badge: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  pending:     { labelKey: 'booking.status_pending',      dot: 'bg-[#f6a003]',    badge: 'bg-[#fff8ed] text-[#b45309] border-[#fde08a]' },
  confirmed:   { labelKey: 'booking.status_confirmed',    dot: 'bg-emerald-400',  badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  checked_in:  { labelKey: 'booking.status_checked_in',   dot: 'bg-blue-400',     badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  checked_out: { labelKey: 'booking.status_checked_out',  dot: 'bg-purple-400',   badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  cancelled:   { labelKey: 'booking.status_cancelled',    dot: 'bg-red-400',      badge: 'bg-red-50 text-red-600 border-red-200' },
  no_show:     { labelKey: 'booking.status_no_show',      dot: 'bg-neutral-300',  badge: 'bg-neutral-100 text-neutral-400 border-neutral-200' },
};

const STATUSES = ['all', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];

const PAYMENT_STYLES = {
  paid:    'text-emerald-600 bg-emerald-50',
  pending: 'text-amber-600 bg-amber-50',
  partial: 'text-blue-600 bg-blue-50',
};

const StatusBadge = ({ status, t }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {t(cfg.labelKey)}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center gap-4">
    <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', color)}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-black text-neutral-900 leading-none">{value}</p>
      <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs font-medium text-neutral-600 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function BookingsPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const role = useSelector(selectUserRole);

  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const { data } = await bookingApi.getHotelBookings(hotelId, {
        page, limit: 15,
        status: status || undefined,
        search: search || undefined,
      });
      setBookings(data.data || []);
      setPagination(data.pagination);
    } catch { toast.error(t('errors.loadFailed')); }
    finally { setLoading(false); }
  }, [hotelId, page, status, search, t]);

  useEffect(() => {
    if (hotelId) {
      load();
    }
  }, [hotelId, page, status, search]);

  const handleAction = async (action, booking) => {
    try {
      switch (action) {
        case 'approve':
          await bookingApi.approveBooking(hotelId, booking._id);
          toast.success(t('booking.approved'));
          break;
        case 'reject': {
          const reason = prompt(t('booking.rejectPrompt')) || t('booking.rejectedByHotel');
          await bookingApi.rejectBooking(hotelId, booking._id, { reason });
          toast.success(t('booking.rejected'));
          break;
        }
        case 'checkin':
          await bookingApi.checkIn(hotelId, booking._id);
          toast.success(t('booking.checkedIn'));
          break;
        case 'checkout':
          await bookingApi.checkOut(hotelId, booking._id);
          toast.success(t('booking.checkedOut'));
          break;
        case 'cancel':
          if (!confirm(t('booking.cancelConfirm'))) return;
          await bookingApi.cancelBooking(hotelId, booking._id, { reason: t('booking.cancelledByStaff') });
          toast.success(t('booking.cancelled'));
          break;
      }
      load();
    } catch (err) { toast.error(err.response?.data?.message || t('errors.actionFailed')); }
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const checkedInCount = bookings.filter(b => b.status === 'checked_in').length;
  const todayRevenue = bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-5 h-5 text-[#f6a003]" />
            <h1 className="text-2xl font-black text-neutral-900">{t('booking.title')}</h1>
            {pendingCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 bg-[#f6a003] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm shadow-[#f6a003]/30">
                <AlertCircle className="w-3 h-3" />
                {pendingCount} {t('booking.pending')}
              </motion.span>
            )}
          </div>
          <p className="text-neutral-400 text-sm mt-1">{pagination?.total || 0} {t('booking.totalBookings')}</p>
        </div>
        <button onClick={load} className="w-9 h-9 rounded-2xl border border-neutral-200 hover:border-[#f6a003]/40 flex items-center justify-center text-neutral-400 hover:text-[#f6a003] transition-all hover:bg-[#fff8ed]">
          <RefreshCw className={cn('w-4 h-4 transition-transform', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard icon={AlertCircle} label={t('booking.pendingApproval')} value={pendingCount} sub={t('booking.needAction')} color="bg-[#fff8ed] text-[#b45309]" />
        <StatCard icon={CheckCircle} label={t('booking.checkedIn')} value={checkedInCount} sub={t('booking.currentlyStaying')} color="bg-blue-100 text-blue-600" />
        <StatCard icon={DollarSign} label={t('booking.activeRevenue')} value={formatCurrency(todayRevenue)} sub={t('booking.confirmedInHouse')} color="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          {search && <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-600 transition-colors"><X className="w-3.5 h-3.5" /></button>}
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load(); } }}
            placeholder={t('booking.searchByCode')} className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-neutral-200 bg-white text-sm outline-none focus:border-[#f6a003] focus:ring-2 focus:ring-[#f6a003]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          {STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = (status === s) || (s === 'all' && !status);
            return (
              <button key={s} onClick={() => { setStatus(s === 'all' ? '' : s); setPage(1); }}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all',
                  active ? 'bg-neutral-900 text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300')}
              >
                {cfg && <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-white' : cfg.dot)} />}
                {s === 'all' ? t('booking.allStatuses') : t(cfg.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm shadow-neutral-900/5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[#fde08a] border-t-[#f6a003] rounded-full animate-spin" />
            <p className="text-sm text-neutral-400">{t('booking.loadingBookings')}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <CalendarCheck className="w-8 h-8 text-neutral-300" />
            </div>
            <p className="font-semibold text-neutral-600">{t('booking.noFound')}</p>
            <p className="text-sm text-neutral-400 mt-1">{status ? t('booking.noWithStatus') : t('booking.tryAdjustFilters')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-100">
                  {[t('booking.ref'), t('booking.guest'), t('booking.room'), t('booking.dates'), t('booking.amount'), t('booking.status'), t('common.actions')].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <motion.tr key={b._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="border-b border-neutral-50 hover:bg-[#fff8ed]/40 transition-colors group">
                    <td className="px-4 py-4">
                      <span className="font-mono text-xs font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl">{b.confirmationCode}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600 flex-shrink-0">
                          {(b.userId?.name || 'G')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-800 leading-tight">{b.userId?.name || t('booking.guest')}</p>
                          <p className="text-xs text-neutral-400">{b.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-neutral-700">{b.roomId?.name || '—'}</p>
                      <p className="text-xs text-neutral-400 capitalize">{t(`rooms.${b.roomId?.type}`)}</p>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-sm text-neutral-700 font-medium">
                        {formatDate(b.checkIn, 'MMM d')} → {formatDate(b.checkOut, 'MMM d')}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">{b.nights}n · {b.adults}A</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-black text-neutral-900">{formatCurrency(b.pricing?.totalAmount)}</p>
                      {b.totalPaid > 0 && <p className="text-xs text-emerald-600 mt-0.5">{t('booking.paid')} {formatCurrency(b.totalPaid)}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <StatusBadge status={b.status} t={t} />
                        {b.paymentStatus && <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize block w-fit', PAYMENT_STYLES[b.paymentStatus] || 'text-neutral-400 bg-neutral-100')}>{b.paymentStatus}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button className="w-8 h-8 rounded-xl hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 transition-colors">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {['confirmed', 'checked_in', 'checked_out'].includes(b.status) && (
                          <button className="w-8 h-8 rounded-xl hover:bg-amber-50 flex items-center justify-center text-neutral-400 hover:text-amber-600 transition-colors">
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {b.status === 'pending' && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleAction('approve', b)} className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAction('reject', b)} className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={!pagination.hasPrev}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-[#f6a003]/40 hover:text-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" /> {t('common.prev')}
          </button>
          <span className="text-sm text-neutral-400 font-medium">{page} / {pagination.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasNext}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:border-[#f6a003]/40 hover:text-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {t('common.next')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}