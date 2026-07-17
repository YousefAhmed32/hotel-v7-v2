import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { reviewApi } from '@/services/reviewApi';
import { formatRelative } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

/* ─── Brand ─── */
const BRAND = '#f6a003';
const BRAND_LIGHT = '#fff7e6';
const BRAND_BORDER = '#fde08a';

const STATUS_STYLES = {
  published: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  pending:   'bg-yellow-50  text-yellow-800  border-yellow-200',
  rejected:  'bg-red-50     text-red-700     border-red-200',
};

const StarDisplay = ({ rating, size = 'sm' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star
        key={n}
        className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4',
          n <= rating ? 'fill-current' : 'text-neutral-200 fill-neutral-200'
        )}
        style={{ color: n <= rating ? BRAND : undefined }}
      />
    ))}
  </div>
);

/* ─── Respond modal ─── */
const RespondModal = ({ review, hotelId, onClose, onSuccess, t }) => {
  const [text,    setText]    = useState(review.hotelResponse?.text || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim().length < 5) { toast.error(t('reviews.responseMin')); return; }
    try {
      setLoading(true);
      await reviewApi.respondToReview(hotelId, review._id, { text });
      toast.success(t('reviews.responsePublished'));
      onSuccess();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || t('common.failed')); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: BRAND_LIGHT }}>
              <MessageSquare className="w-4 h-4" style={{ color: BRAND }} />
            </div>
            <h2 className="font-bold text-neutral-900">{t('reviews.respondTo')}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Guest review preview */}
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">
                  {review.userId?.name?.[0]?.toUpperCase() || 'G'}
                </div>
                <p className="font-semibold text-sm text-neutral-800">{review.userId?.name || t('common.guest')}</p>
              </div>
              <StarDisplay rating={review.rating} />
            </div>
            {review.title && <p className="text-sm font-semibold text-neutral-700 mb-1">{review.title}</p>}
            <p className="text-sm text-neutral-500 leading-relaxed">{review.comment}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-neutral-600 uppercase tracking-wide block mb-2">
                {t('reviews.yourResponse')}
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': BRAND }}
                placeholder={t('reviews.responsePlaceholder')}
              />
              <p className="text-xs text-neutral-400 mt-1">{text.length} {t('reviews.characters')}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 hover:brightness-95 transition-all"
                style={{ background: BRAND }}
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><MessageSquare className="w-4 h-4" /> {t('reviews.publishResponse')}</>
                }
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

/* ─── Main page ─── */
export default function ReviewsPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [reviews,        setReviews]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(1);
  const [total,          setTotal]          = useState(0);
  const [statusFilter,   setStatus]         = useState('');
  const [respondTarget,  setRespondTarget]  = useState(null);

  const load = async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const { data } = await reviewApi.getAdminReviews(hotelId, {
        page, limit: 10, status: statusFilter || undefined,
      });
      setReviews(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [hotelId, page, statusFilter]);

  const handleModerate = async (reviewId, status) => {
    try {
      await reviewApi.moderateReview(hotelId, reviewId, { status });
      toast.success(t('reviews.moderated'));
      load();
    } catch (err) { toast.error(err.response?.data?.message || t('common.failed')); }
  };

  const handleToggleFeatured = async (reviewId) => {
    try { await reviewApi.toggleFeatured(hotelId, reviewId); load(); }
    catch { toast.error(t('common.failed')); }
  };

  /* Average rating */
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const STATUSES = [
    { id: '',          label: t('common.all') },
    { id: 'published', label: t('reviews.published') },
    { id: 'pending',   label: t('reviews.pending') },
    { id: 'rejected',  label: t('reviews.rejected') },
  ];

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: BRAND_LIGHT }}>
              <Star className="w-5 h-5" style={{ color: BRAND }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t('reviews.title')}</h1>
              <p className="text-neutral-400 text-sm mt-0.5">{total} {t('reviews.totalCount')}</p>
            </div>
          </div>
        </div>
        {avgRating && (
          <div className="flex items-center gap-3 bg-white border border-neutral-100 px-4 py-3 rounded-2xl shadow-sm">
            <div>
              <p className="text-2xl font-bold" style={{ color: BRAND }}>{avgRating}</p>
              <p className="text-xs text-neutral-400">{t('reviews.avgRating')}</p>
            </div>
            <div className="h-10 w-px bg-neutral-100" />
            <StarDisplay rating={Math.round(parseFloat(avgRating))} size="md" />
          </div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(({ id, label }) => {
          const count = id === '' ? total : reviews.filter(r => r.status === id).length;
          const active = statusFilter === id;
          return (
            <button
              key={id}
              onClick={() => { setStatus(id); setPage(1); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
              style={active
                ? { background: BRAND, borderColor: BRAND, color: '#fff', boxShadow: '0 2px 8px rgba(246,160,3,0.3)' }
                : { background: '#fff', borderColor: '#e5e5e5', color: '#525252' }
              }
            >
              {label}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={active
                  ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                  : { background: '#f5f5f5', color: '#737373' }
                }
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-neutral-100 border-t-[#f6a003] animate-spin" />
          <p className="text-sm text-neutral-400">{t('reviews.loading')}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: BRAND_LIGHT }}>
            <Star className="w-8 h-8" style={{ color: BRAND }} />
          </div>
          <p className="text-neutral-500 font-medium">{t('reviews.noReviews')}</p>
          <p className="text-neutral-400 text-sm mt-1">{t('reviews.noReviewsDesc')}</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {reviews.map((review, i) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-md transition-shadow"
              >
                {/* Review header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{ background: BRAND }}
                    >
                      {review.userId?.name?.[0]?.toUpperCase() || 'G'}
                    </div>
                    <div>
                      <p className="font-bold text-neutral-900 text-sm">{review.userId?.name || t('common.guest')}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{formatRelative(review.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StarDisplay rating={review.rating} />
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize', STATUS_STYLES[review.status] || STATUS_STYLES.pending)}>
                      {t(`reviews.${review.status}`)}
                    </span>
                    {review.isFeatured && (
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
                        style={{ background: BRAND_LIGHT, borderColor: BRAND_BORDER, color: '#92400e' }}
                      >
                        ★ {t('reviews.featured')}
                      </span>
                    )}
                  </div>
                </div>

                {review.title && (
                  <p className="font-bold text-neutral-800 mb-1">{review.title}</p>
                )}
                <p className="text-neutral-600 text-sm leading-relaxed">{review.comment}</p>

                {/* Hotel response */}
                {review.hotelResponse?.text && (
                  <div
                    className="mt-3 p-4 rounded-xl border"
                    style={{ background: BRAND_LIGHT, borderColor: BRAND_BORDER }}
                  >
                    <p className="text-xs font-bold mb-1.5" style={{ color: '#92400e' }}>
                      📝 {t('reviews.yourResponse')}
                    </p>
                    <p className="text-sm text-neutral-700 leading-relaxed">{review.hotelResponse.text}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => setRespondTarget(review)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {review.hotelResponse?.text ? t('reviews.editResponse') : t('reviews.respond')}
                  </button>
                  {review.status !== 'published' && (
                    <button
                      onClick={() => handleModerate(review._id, 'published')}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> {t('reviews.publish')}
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button
                      onClick={() => handleModerate(review._id, 'rejected')}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> {t('reviews.reject')}
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleFeatured(review._id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all"
                    style={review.isFeatured
                      ? { background: BRAND_LIGHT, borderColor: BRAND_BORDER, color: '#92400e' }
                      : { borderColor: '#e5e5e5', color: '#525252', background: '#fff' }
                    }
                  >
                    <Star className="w-3.5 h-3.5" />
                    {review.isFeatured ? t('reviews.unfeature') : t('reviews.feature')}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all"
          >
            ← {t('common.prev')}
          </button>
          <span className="text-sm text-neutral-500 font-medium px-2">
            {t('common.page')} {page} {t('common.of')} {Math.ceil(total / 10)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={reviews.length < 10}
            className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 transition-all"
          >
            {t('common.next')} →
          </button>
        </div>
      )}

      {/* Respond Modal */}
      <AnimatePresence>
        {respondTarget && (
          <RespondModal
            review={respondTarget}
            hotelId={hotelId}
            onClose={() => setRespondTarget(null)}
            onSuccess={load}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}