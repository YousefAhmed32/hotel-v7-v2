import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User, CalendarCheck, Star, Clock, Settings,
  Check, X, AlertTriangle,
  BedDouble, ArrowRight, FileText, LogIn
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMyBookings, selectMyBookings, selectBookingsLoading } from '@/features/booking/bookingSlice';
import { selectUser } from '@/features/auth/authSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { reviewApi } from '@/services/reviewApi';
import { bookingApi } from '@/services/bookingApi';
import { cn } from '@/utils/cn';

/* ── Brand tokens ── */
const B = {
  primary:     '#f6a003',
  primaryDark: '#d98902',
  primaryBg:   '#fff8ed',
  primaryRing: '#fde68a',
  primaryText: '#b45309',
  surface:     '#fafaf9',
  border:      '#e8e5e0',
  ink:         '#111111',
  ink2:        '#444444',
  ink3:        '#888888',
};

/* ── Status labels via i18n ── */
const useStatusCfg = () => {
  const { t } = useTranslation();
  return {
    confirmed:   { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: t('profile.statusConfirmed')  },
    pending:     { bg: B.primaryBg, text: B.primaryText, border: B.primaryRing, label: t('profile.statusPending') },
    cancelled:   { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: t('profile.statusCancelled')  },
    completed:   { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: t('profile.statusCheckedOut') },
    no_show:     { bg: '#fafafa', text: '#737373', border: '#e5e5e5', label: t('booking.status_no_show')   },
    locked:      { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', label: t('booking.status_locked')    },
    checked_in:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: t('profile.statusCheckedIn')  },
    checked_out: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', label: t('profile.statusCheckedOut') },
  };
};

/* ── Star Input ── */
const StarInput = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1,2,3,4,5].map(n => (
      <button key={n} type="button" onClick={() => onChange(n)}
        style={{ background:'none', border:'none', cursor:'pointer', padding:2, transition:'transform .15s' }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.15)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
      >
        <Star style={{ width:28, height:28,
          color: n<=value ? B.primary : '#e5e5e5',
          fill:  n<=value ? B.primary : '#e5e5e5' }} />
      </button>
    ))}
  </div>
);

/* ── Write Review Modal ── */
const WriteReviewModal = ({ booking, hotelId, onClose, onSuccess }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [form, setForm]       = useState({ rating:5, title:'', comment:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.comment.trim().length < 10) { toast.error(t('reviews.commentMinLength')); return; }
    try {
      setLoading(true);
      await reviewApi.createReview(hotelId, { ...form, bookingId: booking._id });
      toast.success(t('reviews.success'));
      onSuccess(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || t('errors.general')); }
    finally { setLoading(false); }
  };

  const inputSty = {
    width:'100%', padding:'11px 14px', borderRadius:12, boxSizing:'border-box',
    border:`1.5px solid ${B.border}`, background:B.surface, fontSize:14,
    outline:'none', transition:'border-color .2s', color:B.ink,
    textAlign: isRtl ? 'right' : 'left',
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.45)',
                  backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
                  justifyContent:'center', padding:16 }}>
      <motion.div initial={{ opacity:0, scale:0.94, y:24 }} animate={{ opacity:1, scale:1, y:0 }}
        transition={{ duration:0.25, ease:[0.22,1,0.36,1] }}
        style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:480,
                 boxShadow:'0 24px 64px rgba(0,0,0,0.15)', overflow:'hidden' }}
        dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'20px 24px', borderBottom:`1px solid ${B.border}` }}>
          <div>
            <h2 style={{ fontWeight:700, color:B.ink, margin:0, fontSize:16 }}>
              {t('reviews.writeReview')}
            </h2>
            <p style={{ fontSize:13, color:B.ink3, marginTop:2 }}>
              {booking.hotelId?.name} · {booking.roomId?.name}
            </p>
          </div>
          <button onClick={onClose}
            style={{ width:34, height:34, borderRadius:10, border:'none', background:'#f5f5f5',
                     color:B.ink3, cursor:'pointer', display:'flex', alignItems:'center',
                     justifyContent:'center', transition:'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#ebebeb'}
            onMouseLeave={e => e.currentTarget.style.background='#f5f5f5'}>
            <X style={{ width:16, height:16 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:24, display:'flex', flexDirection:'column', gap:16 }}>
          {/* Rating */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase',
                            letterSpacing:'.08em', color:B.ink3, marginBottom:8 }}>
              {t('reviews.rating')}
            </label>
            <StarInput value={form.rating} onChange={v => setForm(p => ({...p, rating:v}))} />
          </div>

          {/* Title */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase',
                            letterSpacing:'.08em', color:B.ink3, marginBottom:6 }}>
              {t('reviews.title_field')}
            </label>
            <input value={form.title} onChange={e => setForm(p => ({...p, title:e.target.value}))}
              placeholder={t('profile.reviewTitlePlaceholder')} maxLength={120} style={inputSty}
              onFocus={e => e.target.style.borderColor=B.primary}
              onBlur={e  => e.target.style.borderColor=B.border} />
          </div>

          {/* Comment */}
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:700, textTransform:'uppercase',
                            letterSpacing:'.08em', color:B.ink3, marginBottom:6 }}>
              {t('reviews.comment')} *
            </label>
            <textarea value={form.comment} onChange={e => setForm(p => ({...p, comment:e.target.value}))}
              required minLength={10} rows={4}
              placeholder={t('reviews.commentPlaceholder')}
              style={{ ...inputSty, resize:'none' }}
              onFocus={e => e.target.style.borderColor=B.primary}
              onBlur={e  => e.target.style.borderColor=B.border} />
            <p style={{ fontSize:11, color:B.ink3, textAlign: isRtl ? 'left' : 'right', marginTop:3 }}>
              {form.comment.length}/2000
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:'11px 0', borderRadius:12, border:`1.5px solid ${B.border}`,
                       background:'#fff', fontSize:14, fontWeight:600, color:B.ink2, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background=B.surface}
              onMouseLeave={e => e.currentTarget.style.background='#fff'}>
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={loading}
              style={{ flex:1, padding:'11px 0', borderRadius:12, border:'none', color:'#fff',
                       fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer',
                       background:`linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
                       boxShadow:`0 4px 16px ${B.primary}40`,
                       display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                       opacity: loading ? 0.7 : 1 }}>
              {loading
                ? <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)',
                                borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                : <><Star style={{ width:15, height:15 }} /> {t('reviews.submit')}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ── Cancel Modal ── */
const CancelModal = ({ booking, onClose, onConfirm }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(booking._id, reason);
    setLoading(false); onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.45)',
                  backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
                  justifyContent:'center', padding:16 }}>
      <motion.div initial={{ opacity:0, scale:0.94 }} animate={{ opacity:1, scale:1 }}
        transition={{ duration:0.2, ease:[0.22,1,0.36,1] }}
        style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:420,
                 boxShadow:'0 24px 64px rgba(0,0,0,0.15)', padding:24 }}
        dir={isRtl ? 'rtl' : 'ltr'}>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'#fef2f2',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <AlertTriangle style={{ width:20, height:20, color:'#dc2626' }} />
          </div>
          <div>
            <h2 style={{ fontWeight:700, color:B.ink, margin:0, fontSize:16 }}>
              {t('profile.cancelModalTitle')}
            </h2>
            <p style={{ fontSize:12, color:B.ink3, marginTop:2 }}>{booking.confirmationCode}</p>
          </div>
        </div>

        <p style={{ fontSize:14, color:B.ink2, marginBottom:14 }}>{t('profile.cancelModalSubtitle')}</p>

        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
          placeholder={t('profile.cancelReasonPlaceholder')}
          style={{ width:'100%', padding:'11px 14px', borderRadius:12, boxSizing:'border-box',
                   border:`1.5px solid ${B.border}`, background:B.surface, fontSize:14,
                   outline:'none', resize:'none', transition:'border-color .2s',
                   marginBottom:16, color:B.ink, textAlign: isRtl ? 'right' : 'left' }}
          onFocus={e => e.target.style.borderColor=B.primary}
          onBlur={e  => e.target.style.borderColor=B.border} />

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'11px 0', borderRadius:12, border:`1.5px solid ${B.border}`,
                     background:'#fff', fontSize:14, fontWeight:600, color:B.ink2, cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background=B.surface}
            onMouseLeave={e => e.currentTarget.style.background='#fff'}>
            {t('profile.keepBooking')}
          </button>
          <button onClick={handleConfirm} disabled={loading}
            style={{ flex:1, padding:'11px 0', borderRadius:12, border:'none',
                     background:'#ef4444', color:'#fff', fontSize:14, fontWeight:700,
                     cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                     display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.background='#dc2626'; }}
            onMouseLeave={e => e.currentTarget.style.background='#ef4444'}>
            {loading
              ? <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,.3)',
                              borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
              : t('profile.cancelBooking')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Status Badge ── */
const StatusBadge = ({ status }) => {
  const cfgMap = useStatusCfg();
  const cfg = cfgMap[status] || cfgMap.pending;
  return (
    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                   border:`1px solid ${cfg.border}`, background:cfg.bg, color:cfg.text,
                   whiteSpace:'nowrap', flexShrink:0 }}>
      {cfg.label}
    </span>
  );
};

/* ── Booking Card ── */
const BookingCard = ({ booking, onCancel, onReview }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [expanded, setExpanded] = useState(false);
  const canCancel = ['confirmed','pending'].includes(booking.status);
  const canReview = booking.status === 'completed' && !booking.hasReview;

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
      style={{ background:'#fff', borderRadius:20, overflow:'hidden',
               border:`1.5px solid ${B.border}`, boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
               transition:'box-shadow .25s, border-color .25s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 32px rgba(0,0,0,0.09)';
                           e.currentTarget.style.borderColor=B.primaryRing; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)';
                           e.currentTarget.style.borderColor=B.border; }}>

      <div style={{ display:'flex', gap:14, padding:18 }} dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Image */}
        <div style={{ width:80, height:80, borderRadius:16, flexShrink:0,
                      overflow:'hidden', background:B.surface }}>
          {booking.hotelId?.coverImage
            ? <img src={'/api/v1/media/'+booking.hotelId.coverImage} alt=""
                   style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex',
                            alignItems:'center', justifyContent:'center' }}>
                <BedDouble style={{ width:28, height:28, color:B.border }} />
              </div>}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start',
                        justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
            <div style={{ minWidth:0 }}>
              <p style={{ fontWeight:700, color:B.ink, margin:0,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {booking.hotelId?.name || t('booking.room')}
              </p>
              <p style={{ fontSize:13, color:B.ink3, marginTop:2, textTransform:'capitalize' }}>
                {booking.roomId?.name}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:8, fontSize:12, color:B.ink3 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <CalendarCheck style={{ width:13, height:13 }} />
              {formatDate(booking.checkIn, 'MMM d')} → {formatDate(booking.checkOut, 'MMM d, yyyy')}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Clock style={{ width:13, height:13 }} />
              {booking.nights} {t('common.nights')}
            </span>
            <span style={{ fontFamily:'monospace', fontWeight:700, color:B.primary }}>
              {booking.confirmationCode}
            </span>
          </div>
        </div>

        {/* Price + toggle */}
        <div style={{ display:'flex', flexDirection:'column',
                      alignItems: isRtl ? 'flex-start' : 'flex-end',
                      justifyContent:'space-between', flexShrink:0 }}>
          <p style={{ fontWeight:900, fontSize:18, color:B.primary, margin:0 }}>
            {formatCurrency(booking.pricing?.totalAmount)}
          </p>
          <button onClick={() => setExpanded(p => !p)}
            style={{ fontSize:12, color:B.ink3, background:'none', border:'none',
                     cursor:'pointer', marginTop:8, padding:0, transition:'color .15s' }}
            onMouseEnter={e => e.currentTarget.style.color=B.primary}
            onMouseLeave={e => e.currentTarget.style.color=B.ink3}>
            {expanded ? t('profile.less') : t('profile.details')}
          </button>
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.25, ease:[0.22,1,0.36,1] }}
            style={{ overflow:'hidden', borderTop:`1px solid ${B.border}` }}>
            <div style={{ padding:'16px 18px 18px' }} dir={isRtl ? 'rtl' : 'ltr'}>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:14 }}
                   className="sm:!grid-cols-4">
                {[
                  { label:t('common.adults'),         value:booking.adults },
                  { label:t('profile.paymentStatus'), value:booking.paymentStatus, cap:true },
                  { label:t('profile.baseAmount'),    value:formatCurrency(booking.pricing?.baseAmount) },
                  { label:t('profile.taxes'),         value:formatCurrency(booking.pricing?.taxAmount) },
                ].map(({ label, value, cap }) => (
                  <div key={label} style={{ background:B.surface, borderRadius:12, padding:'10px 12px',
                                            border:`1px solid ${B.border}` }}>
                    <p style={{ fontSize:11, color:B.ink3, margin:0, marginBottom:3 }}>{label}</p>
                    <p style={{ fontSize:13, fontWeight:700, color:B.ink, margin:0,
                                textTransform: cap ? 'capitalize' : 'none' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Special requests */}
              {booking.guestDetails?.specialRequests && (
                <div style={{ background:B.surface, borderRadius:12, padding:'10px 14px',
                              border:`1px solid ${B.border}`, marginBottom:14, fontSize:13, color:B.ink2 }}>
                  <span style={{ fontWeight:700, color:B.ink }}>{t('profile.specialRequests')}: </span>
                  {booking.guestDetails.specialRequests}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {canReview && (
                  <button onClick={() => onReview(booking)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                             borderRadius:12, border:'none',
                             background:`linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
                             color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
                             boxShadow:`0 3px 12px ${B.primary}40` }}>
                    <Star style={{ width:13, height:13 }} /> {t('profile.writeReview')}
                  </button>
                )}
                {booking.hasReview && (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
                                 borderRadius:12, fontSize:13, fontWeight:600,
                                 color:'#15803d', background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                    <Check style={{ width:13, height:13 }} /> {t('profile.reviewSubmitted')}
                  </span>
                )}
                {['checked_out','completed'].includes(booking.status) && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/v1/hotels/${booking.hotelId?._id}/bookings/${booking._id}/invoice`,
                          { headers:{ Authorization:'Bearer '+localStorage.getItem('accessToken') } }
                        );
                        if (!res.ok) throw new Error();
                        const blob = await res.blob();
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `invoice-${booking.confirmationCode}.pdf`;
                        a.click();
                      } catch { toast.error(t('payment.invoiceError')); }
                    }}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                             borderRadius:12, fontSize:13, fontWeight:600,
                             color:B.primaryText, border:`1px solid ${B.primaryRing}`,
                             background:B.primaryBg, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor=B.primary}
                    onMouseLeave={e => e.currentTarget.style.borderColor=B.primaryRing}>
                    <FileText style={{ width:13, height:13 }} /> {t('profile.downloadInvoice')}
                  </button>
                )}
                {booking.status === 'checked_in' && (
                  <Link to="/my-room"
                    style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px',
                             borderRadius:12, fontSize:13, fontWeight:700, color:'#fff',
                             textDecoration:'none',
                             background:`linear-gradient(135deg, ${B.primary}, ${B.primaryDark})` }}>
                    <LogIn style={{ width:13, height:13 }} /> {t('profile.myRoomPanel')}
                  </Link>
                )}
                {canCancel && (
                  <button onClick={() => onCancel(booking)}
                    style={{ padding:'8px 16px', borderRadius:12, fontSize:13, fontWeight:600,
                             color:'#dc2626', border:'1px solid #fecaca', background:'#fff', cursor:'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.borderColor='#f87171'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='#fff';    e.currentTarget.style.borderColor='#fecaca'; }}>
                    {t('profile.cancelBooking')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Bookings Tab ── */
const BookingsTab = () => {
  const { t } = useTranslation();
  const dispatch  = useDispatch();
  const bookings  = useSelector(selectMyBookings);
  const isLoading = useSelector(selectBookingsLoading);
  const [filter, setFilter]             = useState('all');
  const [reviewTarget, setReviewTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reviewed, setReviewed]         = useState(new Set());

  useEffect(() => { dispatch(fetchMyBookings({ page:1, limit:30 })); }, [dispatch]);

  const FILTERS = [
    { id:'all',       label:t('profile.filterAll')       },
    { id:'confirmed', label:t('profile.upcoming')        },
    { id:'completed', label:t('profile.completed')       },
    { id:'cancelled', label:t('profile.filterCancelled') },
  ];

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const handleCancel = async (bookingId, reason) => {
    try {
      await bookingApi.cancelMyBooking(bookingId, { reason });
      toast.success(t('booking.cancelled'));
      dispatch(fetchMyBookings({ page:1, limit:30 }));
    } catch (err) { toast.error(err.response?.data?.message || t('profile.cancelFailed')); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Filter pills */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {FILTERS.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ padding:'7px 18px', borderRadius:12, fontSize:13, fontWeight:600,
                     cursor:'pointer', transition:'all .2s',
                     ...(filter===id
                       ? { background:B.primary, color:'#fff', border:'none', boxShadow:`0 3px 12px ${B.primary}40` }
                       : { background:'#fff', color:B.ink2, border:`1.5px solid ${B.border}` }) }}
            onMouseEnter={e => { if(filter!==id) e.currentTarget.style.borderColor=B.primary; }}
            onMouseLeave={e => { if(filter!==id) e.currentTarget.style.borderColor=B.border;  }}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'64px 0' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:20, padding:'64px 24px', textAlign:'center',
                      border:`1.5px solid ${B.border}` }}>
          <div style={{ width:64, height:64, borderRadius:20, background:B.primaryBg,
                        display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <CalendarCheck style={{ width:28, height:28, color:B.primary }} />
          </div>
          <p style={{ fontWeight:600, color:B.ink, marginBottom:6 }}>
            {t('profile.emptyBookings', { filter: filter!=='all' ? filter : '' })}
          </p>
          <p style={{ fontSize:13, color:B.ink3, marginBottom:20 }}>{t('booking.noBookingsYet')}</p>
          <Link to="/hotels" style={{ display:'inline-flex', alignItems:'center', gap:6,
                                      padding:'10px 22px', borderRadius:12, fontSize:13, fontWeight:700,
                                      color:'#fff', textDecoration:'none',
                                      background:`linear-gradient(135deg, ${B.primary}, ${B.primaryDark})` }}>
            {t('nav.exploreHotels')} <ArrowRight style={{ width:14, height:14 }} />
          </Link>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map(b => (
            <BookingCard key={b._id}
              booking={reviewed.has(b._id) ? {...b, hasReview:true} : b}
              onCancel={setCancelTarget} onReview={setReviewTarget} />
          ))}
        </div>
      )}

      {reviewTarget && (
        <WriteReviewModal booking={reviewTarget} hotelId={reviewTarget.hotelId?._id}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => setReviewed(p => new Set([...p, reviewTarget._id]))} />
      )}
      {cancelTarget && (
        <CancelModal booking={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} />
      )}
    </div>
  );
};

/* ── Settings Tab ── */
const SettingsTab = ({ user }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [form, setForm]     = useState({ name:user?.name||'', phone:user?.phone||'' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [saving, setSaving]   = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const inputSty = {
    width:'100%', padding:'11px 14px', borderRadius:12, boxSizing:'border-box',
    border:`1.5px solid ${B.border}`, background:B.surface,
    fontSize:14, outline:'none', transition:'border-color .2s',
    color:B.ink, textAlign: isRtl ? 'right' : 'left',
  };
  const Field = ({ label, children }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.08em', color:B.ink3 }}>{label}</label>
      {children}
    </div>
  );
  const SaveBtn = ({ loading, label }) => (
    <button disabled={loading}
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 22px',
               borderRadius:12, border:'none', color:'#fff', fontSize:13, fontWeight:700,
               background:`linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
               boxShadow:`0 3px 12px ${B.primary}40`,
               cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading
        ? <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)',
                        borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
        : <><Check style={{ width:14, height:14 }} /> {label}</>}
    </button>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:520 }}
         dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Personal info */}
      <div style={{ background:'#fff', borderRadius:20, padding:24, border:`1.5px solid ${B.border}`,
                    display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:B.primaryBg,
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
            <User style={{ width:16, height:16, color:B.primary }} />
          </div>
          <h3 style={{ fontWeight:700, color:B.ink, margin:0 }}>{t('profile.personalInfo')}</h3>
        </div>
        <Field label={t('auth.fullName')}>
          <input value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))}
            style={inputSty}
            onFocus={e => e.target.style.borderColor=B.primary}
            onBlur={e  => e.target.style.borderColor=B.border} />
        </Field>
        <Field label={t('common.phone')}>
          <input value={form.phone} onChange={e => setForm(p => ({...p, phone:e.target.value}))}
            placeholder={t('profile.phonePlaceholder')} style={inputSty}
            onFocus={e => e.target.style.borderColor=B.primary}
            onBlur={e  => e.target.style.borderColor=B.border} />
        </Field>
        <Field label={t('common.email')}>
          <input value={user?.email||''} disabled
            style={{ ...inputSty, color:B.ink3, cursor:'not-allowed', background:'#f5f5f5' }} />
        </Field>
        <SaveBtn loading={saving} label={t('profile.updateProfile')} />
      </div>

      {/* Change password */}
      <div style={{ background:'#fff', borderRadius:20, padding:24, border:`1.5px solid ${B.border}`,
                    display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:B.primaryBg,
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Settings style={{ width:16, height:16, color:B.primary }} />
          </div>
          <h3 style={{ fontWeight:700, color:B.ink, margin:0 }}>{t('profile.changePassword')}</h3>
        </div>
        {[
          { key:'currentPassword', label:t('profile.currentPassword') },
          { key:'newPassword',     label:t('profile.newPassword')     },
          { key:'confirmPassword', label:t('profile.confirmPassword') },
        ].map(({ key, label }) => (
          <Field key={key} label={label}>
            <input type="password" value={pwForm[key]}
              onChange={e => setPwForm(p => ({...p, [key]:e.target.value}))}
              placeholder="••••••••" style={inputSty}
              onFocus={e => e.target.style.borderColor=B.primary}
              onBlur={e  => e.target.style.borderColor=B.border} />
          </Field>
        ))}
        <SaveBtn loading={savingPw} label={t('profile.updatePassword')} />
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   Main Page
════════════════════════════════════════════ */
export default function ProfilePage({ tab: initialTab = 'bookings' }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const user = useSelector(selectUser);
  const [tab, setTab] = useState(initialTab);

  const TABS = [
    { id:'bookings', icon:CalendarCheck, label:t('profile.myBookings')     },
    { id:'settings', icon:Settings,      label:t('profile.accountSettings') },
  ];

  if (!user) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <LoadingSpinner size="xl" />
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ minHeight:'100vh', padding:'32px 16px', background:B.surface }}
           dir={isRtl ? 'rtl' : 'ltr'}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>

          {/* Profile Hero */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.4, ease:[0.22,1,0.36,1] }}
            style={{ background:'#fff', borderRadius:24, padding:24, marginBottom:20,
                     border:`1.5px solid ${B.border}`, overflow:'hidden', position:'relative',
                     boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
                          background:`linear-gradient(90deg, ${B.primary}, ${B.primaryDark})` }} />
            <div style={{ display:'flex', flexDirection:'column', gap:16, paddingTop:8 }}
                 className="sm:flex-row sm:items-start">
              {/* Avatar */}
              <div style={{ position:'relative', flexShrink:0, alignSelf:'center' }}>
                <div style={{ width:80, height:80, borderRadius:20,
                              background:`linear-gradient(135deg, ${B.primary}, ${B.primaryDark})`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              color:'#fff', fontWeight:900, fontSize:32,
                              boxShadow:`0 8px 24px ${B.primary}40` }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ position:'absolute', bottom:-3,
                              [isRtl ? 'left' : 'right']: -3,
                              width:24, height:24, borderRadius:'50%',
                              background:'#4ade80', border:'2px solid #fff',
                              display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check style={{ width:12, height:12, color:'#fff' }} />
                </div>
              </div>
              {/* Info */}
              <div style={{ flex:1, textAlign: isRtl ? 'right' : 'left' }}>
                <h1 style={{ fontSize:22, fontWeight:900, color:B.ink, margin:0 }}>{user.name}</h1>
                <p style={{ fontSize:13, color:B.ink3, marginTop:3 }}>{user.email}</p>
                <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap',
                              justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
                                 background:B.primaryBg, color:B.primaryText,
                                 border:`1px solid ${B.primaryRing}`, textTransform:'capitalize' }}>
                    {user.role}
                  </span>
                  <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
                                 background:'#f5f5f5', color:B.ink2 }}>
                    {t('staff.member')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {TABS.map(({ id, icon:Icon, label }, i) => (
              <motion.button key={id} onClick={() => setTab(id)}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.06, duration:0.3 }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px',
                         borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all .2s',
                         ...(tab===id
                           ? { background:B.primary, color:'#fff', border:'none', boxShadow:`0 3px 14px ${B.primary}40` }
                           : { background:'#fff', color:B.ink2, border:`1.5px solid ${B.border}` }) }}
                onMouseEnter={e => { if(tab!==id) e.currentTarget.style.borderColor=B.primary; }}
                onMouseLeave={e => { if(tab!==id) e.currentTarget.style.borderColor=B.border;  }}>
                <Icon style={{ width:15, height:15 }} /> {label}
              </motion.button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.22, ease:'easeOut' }}>
              {tab === 'bookings' && <BookingsTab />}
              {tab === 'settings' && <SettingsTab user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}