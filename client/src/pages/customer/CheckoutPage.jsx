import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, CreditCard, Check, ChevronLeft, Lock,
  Clock, Tag, X, Shield, BedDouble, ChevronRight,
  Wifi, Coffee, Car, Sparkles, AlertCircle, Phone, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  lockBookingSlot, confirmBookingThunk,
  selectCurrentLock, selectIsLocking, selectIsConfirming, clearLock
} from '@/features/booking/bookingSlice';
import { selectUser } from '@/features/auth/authSlice';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { couponApi } from '@/services/couponApi';
import api from '@/services/api';
import { cn } from '@/utils/cn';

/* ── Brand tokens ── */
const G = {
  gold:     '#f6a003',
  goldDark: '#d98902',
  goldBg:   '#fff8ed',
  goldRing: '#fde68a',
  goldText: '#b45309',
  surface:  '#fafaf9',
  border:   '#e8e5e0',
  ink:      '#111111',
  ink2:     '#444444',
  ink3:     '#888888',
};

/* ── Countdown Timer ── */
const CountDown = ({ expiresAt }) => {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins   = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs   = String(remaining % 60).padStart(2, '0');
  const urgent = remaining < 120;
  const pct    = Math.min(100, (remaining / 600) * 100);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 16px', borderRadius: 20,
      background: urgent ? 'rgba(239,68,68,0.08)' : `${G.goldBg}`,
      border: `1px solid ${urgent ? '#fecaca' : G.goldRing}`,
      color: urgent ? '#dc2626' : G.goldDark,
      fontSize: 13, fontWeight: 500,
    }}>
      <div style={{ position: 'relative', width: 20, height: 20 }}>
        <svg style={{ width: 20, height: 20, transform: 'rotate(-90deg)' }} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor"
            strokeOpacity="0.2" strokeWidth="2" />
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 8}`}
            strokeDashoffset={`${2 * Math.PI * 8 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
      </div>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '.08em' }}>
        {mins}:{secs}
      </span>
      <span style={{ fontSize: 11, opacity: 0.7 }}>{t('booking.remaining')}</span>
    </div>
  );
};

/* ── Step Bar ── */
const StepBar = ({ step }) => {
  const { t } = useTranslation();
  const STEPS = [
    { n: 1, label: t('booking.stepGuest')   },
    { n: 2, label: t('booking.stepPayment') },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {STEPS.map(({ n, label }, idx) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div
              animate={{
                scale: step === n ? 1.05 : 1,
                backgroundColor: step > n ? '#10b981' : step === n ? G.gold : '#e5e7eb',
              }}
              style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex',
                       alignItems: 'center', justifyContent: 'center',
                       fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {step > n ? <Check style={{ width: 14, height: 14 }} /> : n}
            </motion.div>
            <span style={{ fontSize: 13, fontWeight: 600, display: 'none',
                           color: step >= n ? G.ink : G.ink3 }}
                  className="sm:block">
              {label}
            </span>
          </div>
          {idx === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', transition: 'all .3s',
                  transitionDelay: `${i * 60}ms`,
                  background: step > 1 ? '#10b981' : '#e5e7eb',
                }} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Booking Summary ── */
const BookingSummary = ({ room, hotel, checkIn, checkOut, adults, couponResult, onRemoveCoupon }) => {
  const { t } = useTranslation();
  if (!room || !checkIn || !checkOut) return null;
  const nights   = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
  const base     = room.basePrice * nights;
  const tax      = Math.round(base * 0.14 * 100) / 100;
  const discount = couponResult?.discountAmount || 0;
  const total    = Math.round((base + tax - discount) * 100) / 100;

  const AMENITY_ICONS = { wifi: Wifi, breakfast: Coffee, parking: Car };

  return (
    <div style={{ borderRadius: 24, overflow: 'hidden', border: `1.5px solid ${G.border}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)', background: '#fff' }}>
      {/* Room image */}
      <div style={{ position: 'relative', height: 176, overflow: 'hidden' }}>
        {room.coverImage ? (
          <img src={`/api/v1/media/${room.coverImage}`} alt={room.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #fdf6e8, #f5ead0)' }}>
            <BedDouble style={{ width: 48, height: 48, color: '#e8d5a8' }} />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, padding: 16 }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 }}>{hotel?.name}</p>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, margin: 0,
                       fontFamily: 'Playfair Display,serif' }}>{room.name}</h3>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize',
                         background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: 20,
                         marginTop: 4, display: 'inline-block' }}>
            {t(`rooms.${room.type}`) || room.type}
          </span>
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Date grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: t('hotels.checkIn'),  value: formatDate(checkIn, 'EEE, MMM d'),  sub: t('booking.checkout.fromTime')  },
            { label: t('hotels.checkOut'), value: formatDate(checkOut, 'EEE, MMM d'), sub: t('booking.checkout.untilTime') },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: G.surface, borderRadius: 16, padding: 12,
                                      border: `1px solid ${G.border}` }}>
              <p style={{ fontSize: 11, color: G.ink3, marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: G.ink, margin: 0 }}>{value}</p>
              <p style={{ fontSize: 11, color: G.ink3, marginTop: 2 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Stay info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span style={{ color: G.ink3 }}>
            {nights} {t('common.nights')} · {adults} {t('common.adults')}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {room.amenities?.slice(0, 3).map(a => {
              const Icon = AMENITY_ICONS[a] || Sparkles;
              return <Icon key={a} style={{ width: 13, height: 13, color: G.gold }} title={a} />;
            })}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ borderTop: `1px solid ${G.border}`, paddingTop: 16,
                      display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: `${formatCurrency(room.basePrice)} × ${nights} ${t('common.nights')}`, val: formatCurrency(base) },
            { label: t('rooms.taxes'),                                                        val: formatCurrency(tax)  },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                                     fontSize: 13, color: G.ink3 }}>
              <span>{label}</span>
              <span style={{ fontWeight: 500, color: G.ink2 }}>{val}</span>
            </div>
          ))}

          <AnimatePresence>
            {discount > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13,
                         color: '#15803d', background: '#f0fdf4',
                         padding: '8px 12px', borderRadius: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <Tag style={{ width: 13, height: 13 }} />
                  {couponResult?.coupon?.code}
                  <button onClick={onRemoveCoupon}
                    style={{ width: 16, height: 16, borderRadius: '50%', background: '#bbf7d0',
                             border: 'none', cursor: 'pointer', display: 'flex',
                             alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: 10, height: 10 }} />
                  </button>
                </span>
                <span style={{ fontWeight: 700 }}>−{formatCurrency(discount)}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        paddingTop: 10, borderTop: `1px solid ${G.border}` }}>
            <span style={{ fontWeight: 700, color: G.ink }}>{t('rooms.totalPrice')}</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: G.gold }}>
                {formatCurrency(total)}
              </span>
              <p style={{ fontSize: 11, color: G.ink3, margin: 0 }}>
                {t('booking.checkout.allTaxesIncluded')}
              </p>
            </div>
          </div>
        </div>

        {/* Free cancellation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                      background: '#f0fdf4', borderRadius: 16, border: '1px solid #bbf7d0' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield style={{ width: 15, height: 15, color: '#15803d' }} />
          </div>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: 0 }}>
              {t('booking.checkout.freeCancellationTitle')}
            </p>
            <p style={{ fontSize: 11, color: '#22c55e', margin: 0 }}>
              {t('booking.checkout.freeCancellationHours')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Coupon Input ── */
const CouponInput = ({ hotelId, room, checkIn, baseAmount, onApplied }) => {
  const { t } = useTranslation();
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    try {
      setLoading(true);
      const { data } = await couponApi.apply(hotelId, { code, roomId: room._id, checkIn, baseAmount });
      onApplied(data.data);
      setApplied(true);
      toast.success(t('booking.couponAppliedMessage', { amount: formatCurrency(data.data.discountAmount) }));
    } catch (err) {
      toast.error(err.response?.data?.message || t('booking.couponInvalid'));
    } finally { setLoading(false); }
  };

  if (applied) return null;

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Tag style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      width: 15, height: 15, color: G.ink3 }} />
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder={t('booking.couponPlaceholder')}
          style={{
            width: '100%', paddingLeft: 40, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
            borderRadius: 16, border: `1.5px solid ${G.border}`, background: G.surface,
            fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color .2s', letterSpacing: '.06em',
          }}
          onFocus={e => e.target.style.borderColor = G.gold}
          onBlur={e  => e.target.style.borderColor = G.border}
        />
      </div>
      <button onClick={handleApply} disabled={loading || !code.trim()}
        style={{
          padding: '0 20px', borderRadius: 16, border: 'none', background: G.ink,
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !code.trim() ? 0.5 : 1, transition: 'background .15s, opacity .2s',
          display: 'flex', alignItems: 'center',
        }}
        onMouseEnter={e => { if (!loading && code.trim()) e.currentTarget.style.background = G.gold; }}
        onMouseLeave={e => e.currentTarget.style.background = G.ink}>
        {loading
          ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)',
                          borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          : t('booking.apply')}
      </button>
    </div>
  );
};

/* ── Field wrapper ── */
const Field = ({ label, icon: Icon, error, children, style }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
                    color: G.ink3, textTransform: 'uppercase', letterSpacing: '.08em' }}>
      {Icon && <Icon style={{ width: 13, height: 13 }} />}
      {label}
    </label>
    {children}
    {error && (
      <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
        <AlertCircle style={{ width: 11, height: 11 }} /> {error}
      </p>
    )}
  </div>
);

/* ── Payment Option ── */
const PaymentOption = ({ value, label, desc, icon: Icon, selected, onSelect }) => (
  <motion.label whileTap={{ scale: 0.99 }}
    style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16,
      border: `2px solid ${selected ? G.gold : G.border}`,
      background: selected ? G.goldBg : '#fff',
      cursor: 'pointer', transition: 'all .2s',
      boxShadow: selected ? `0 2px 10px ${G.gold}20` : 'none',
    }}>
    <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: selected ? G.goldBg : '#f5f5f5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .2s' }}>
      <Icon style={{ width: 20, height: 20, color: selected ? G.gold : G.ink3 }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: selected ? G.ink : G.ink2, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 11, color: G.ink3, marginTop: 2 }}>{desc}</p>
    </div>
    <div style={{
      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${selected ? G.gold : G.border}`,
      background: selected ? G.gold : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .2s',
    }}>
      {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
    </div>
    <input type="radio" name="paymentMethod" value={value}
      checked={selected} onChange={onSelect} style={{ display: 'none' }} />
  </motion.label>
);

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function CheckoutPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hotelId  = searchParams.get('hotelId');
  const roomId   = searchParams.get('roomId');
  const checkIn  = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const user         = useSelector(selectUser);
  const currentLock  = useSelector(selectCurrentLock);
  const isLocking    = useSelector(selectIsLocking);
  const isConfirming = useSelector(selectIsConfirming);

  const [hotel, setHotel]               = useState(null);
  const [room,  setRoom]                = useState(null);
  const [step,  setStep]                = useState(1);
  const [couponResult, setCouponResult] = useState(null);
  const [errors, setErrors]             = useState({});
  const [guestDetails, setGuestDetails] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName:  user?.name?.split(' ').slice(1).join(' ') || '',
    email:     user?.email || '',
    phone:     '',
    specialRequests: '',
  });
  const [adults,   setAdults]   = useState(1);
  const [children, setChildren] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_arrival');

  useEffect(() => {
    if (!hotelId || !roomId) { navigate('/hotels'); return; }
    if (hotelId.length !== 24) {
      toast.error(t('booking.checkout.invalidHotelId'));
      navigate('/hotels');
      return;
    }
    Promise.all([
      api.get('/hotels/' + hotelId),
      api.get('/hotels/' + hotelId + '/rooms/' + roomId),
    ]).then(([h, r]) => {
      setHotel(h.data.data.hotel);
      setRoom(r.data.data.room);
    }).catch(() => navigate('/hotels'));
    return () => { dispatch(clearLock()); };
  }, []);

  useEffect(() => {
    if (currentLock?.expiresAt) {
      const ms = new Date(currentLock.expiresAt) - new Date();
      const timer = setTimeout(() => {
        toast.error(t('booking.lockExpired'));
        dispatch(clearLock());
        setStep(1);
      }, ms);
      return () => clearTimeout(timer);
    }
  }, [currentLock]);

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 0;

  const validate = () => {
    const e = {};
    if (!guestDetails.firstName.trim()) e.firstName = t('validation.required');
    if (!guestDetails.email.trim())     e.email     = t('validation.required');
    if (guestDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email))
      e.email = t('validation.emailInvalid');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLock = async () => {
    if (!validate()) return;
    const result = await dispatch(lockBookingSlot({
      hotelId, roomId, checkIn, checkOut, adults, children, guestDetails,
    }));
    if (lockBookingSlot.fulfilled.match(result)) {
      setStep(2);
      toast.success(t('booking.roomHeld'));
    } else {
      toast.error(result.payload || t('errors.general'));
    }
  };

  const handleConfirm = async () => {
    if (!currentLock) return;
    const result = await dispatch(confirmBookingThunk({
      bookingId:      currentLock.booking?._id || currentLock._id,
      lockToken:      currentLock.lockToken,
      hotelId,
      paymentMethod,
      couponId:       couponResult?.coupon?._id,
      couponDiscount: couponResult?.discountAmount || 0,
    }));
    if (confirmBookingThunk.fulfilled.match(result)) {
      toast.success(t('booking.bookingConfirmed'));
      navigate('/booking-confirmation/' + result.payload._id);
    } else {
      toast.error(result.payload || t('errors.general'));
    }
  };

  if (!hotel || !room) return (
    <div style={{
      minHeight: '100vh', background: `linear-gradient(135deg, #fafaf9, ${G.goldBg})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `2px solid ${G.gold}40`,
                      borderTopColor: G.gold, borderRadius: '50%',
                      animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: G.ink3 }}>{t('booking.checkout.loading')}</p>
      </div>
    </div>
  );

  const baseAmount = room.basePrice * nights;

  const PAYMENT_OPTIONS = [
    { value: 'cash_on_arrival', label: t('booking.cash'),        desc: t('booking.checkout.paymentOptionDescriptions.cash'),        icon: BedDouble  },
    { value: 'card',            label: t('booking.card'),        desc: t('booking.checkout.paymentOptionDescriptions.card'),        icon: CreditCard },
    { value: 'bank_transfer',   label: t('booking.bankTransfer'), desc: t('booking.checkout.paymentOptionDescriptions.bankTransfer'), icon: Shield    },
    { value: 'partial_30',      label: t('booking.partial30'),   desc: t('booking.checkout.paymentOptionDescriptions.partial30'),   icon: Sparkles   },
  ];

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 16, boxSizing: 'border-box',
    border: `1.5px solid ${G.border}`, background: G.surface, fontSize: 14,
    outline: 'none', transition: 'border-color .2s, box-shadow .2s', color: G.ink,
    textAlign: isRtl ? 'right' : 'left',
  };
  const inputFocus = (e) => { e.target.style.borderColor = G.gold; e.target.style.boxShadow = `0 0 0 3px ${G.gold}18`; };
  const inputBlur  = (e) => { e.target.style.borderColor = G.border; e.target.style.boxShadow = 'none'; };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, #fafaf9 0%, ${G.goldBg} 100%)` }}
           dir={isRtl ? 'rtl' : 'ltr'}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 64px' }}>

          {/* Top nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
            <button onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500,
                       color: G.ink3, background: 'none', border: 'none', cursor: 'pointer',
                       transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = G.ink}
              onMouseLeave={e => e.currentTarget.style.color = G.ink3}>
              <div style={{ width: 32, height: 32, borderRadius: 12, border: `1px solid ${G.border}`,
                            background: '#fff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center' }}>
                {isRtl
                  ? <ChevronRight style={{ width: 15, height: 15 }} />
                  : <ChevronLeft  style={{ width: 15, height: 15 }} />}
              </div>
              {t('common.back')}
            </button>

            <StepBar step={step} />

            {currentLock?.expiresAt
              ? <CountDown expiresAt={currentLock.expiresAt} />
              : <div style={{ width: 120 }} />}
          </div>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}
               className="lg:!grid-cols-[1fr_360px]">

            {/* Form column */}
            <div>
              <AnimatePresence mode="wait">

                {/* ── STEP 1 ── */}
                {step === 1 && (
                  <motion.div key="s1"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Guest info card */}
                    <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${G.border}`,
                                  padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
                                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: G.goldBg,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User style={{ width: 17, height: 17, color: G.gold }} />
                        </div>
                        <div>
                          <h2 style={{ fontWeight: 700, color: G.ink, margin: 0, fontSize: 16 }}>
                            {t('booking.guestInfo')}
                          </h2>
                          <p style={{ fontSize: 12, color: G.ink3, marginTop: 2 }}>
                            {t('booking.checkout.whosStaying')}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <Field label={t('booking.firstName')} error={errors.firstName}>
                          <input type="text" value={guestDetails.firstName}
                            placeholder={isRtl ? 'أحمد' : 'Ahmed'}
                            onChange={e => { setGuestDetails(p => ({ ...p, firstName: e.target.value })); if (errors.firstName) setErrors(p => ({ ...p, firstName: '' })); }}
                            style={{ ...inputStyle, borderColor: errors.firstName ? '#fca5a5' : G.border }}
                            onFocus={inputFocus} onBlur={inputBlur} />
                        </Field>
                        <Field label={t('booking.lastName')}>
                          <input type="text" value={guestDetails.lastName}
                            placeholder={isRtl ? 'حسن' : 'Hassan'}
                            onChange={e => setGuestDetails(p => ({ ...p, lastName: e.target.value }))}
                            style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                        </Field>

                        <Field label={t('common.email')} icon={Mail} error={errors.email}
                               style={{ gridColumn: '1 / -1' }}>
                          <input type="email" value={guestDetails.email} placeholder="you@example.com"
                            onChange={e => { setGuestDetails(p => ({ ...p, email: e.target.value })); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
                            style={{ ...inputStyle, borderColor: errors.email ? '#fca5a5' : G.border }}
                            onFocus={inputFocus} onBlur={inputBlur} />
                        </Field>

                        <Field label={t('common.phone')} icon={Phone} style={{ gridColumn: '1 / -1' }}>
                          <input type="tel" value={guestDetails.phone} placeholder="+20 100 000 0000"
                            onChange={e => setGuestDetails(p => ({ ...p, phone: e.target.value }))}
                            style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                        </Field>
                      </div>
                    </div>

                    {/* Stay details card */}
                    <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${G.border}`,
                                  padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
                                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                      <h2 style={{ fontWeight: 700, color: G.ink, margin: 0, fontSize: 16 }}>
                        {t('booking.checkout.stayDetails')}
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[
                          { label: t('common.adults'),   val: adults,   set: setAdults,   min: 1, max: room.maxAdults  || 6 },
                          { label: t('common.children'), val: children, set: setChildren, min: 0, max: room.maxChildren || 5 },
                        ].map(({ label, val, set, min, max }) => (
                          <Field key={label} label={label}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={() => set(v => Math.max(min, v - 1))}
                                style={{ width: 40, height: 40, borderRadius: 12, border: `1.5px solid ${G.border}`,
                                         background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                                         color: G.ink2, transition: 'border-color .15s, color .15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.goldText; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.ink2; }}>
                                −
                              </button>
                              <span style={{ flex: 1, textAlign: 'center', fontWeight: 700,
                                            fontSize: 16, color: G.ink }}>{val}</span>
                              <button onClick={() => set(v => Math.min(max, v + 1))}
                                style={{ width: 40, height: 40, borderRadius: 12, border: `1.5px solid ${G.border}`,
                                         background: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                                         color: G.ink2, transition: 'border-color .15s, color .15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.goldText; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.ink2; }}>
                                +
                              </button>
                            </div>
                          </Field>
                        ))}

                        <Field label={t('booking.specialRequests')} style={{ gridColumn: '1 / -1' }}>
                          <textarea
                            value={guestDetails.specialRequests} rows={3}
                            onChange={e => setGuestDetails(p => ({ ...p, specialRequests: e.target.value }))}
                            placeholder={t('booking.specialRequestsPlaceholder')}
                            style={{ ...inputStyle, resize: 'none' }}
                            onFocus={inputFocus} onBlur={inputBlur} />
                        </Field>
                      </div>
                    </div>

                    {/* Coupon card */}
                    <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${G.border}`,
                                  padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag style={{ width: 15, height: 15, color: G.gold }} />
                        <p style={{ fontSize: 14, fontWeight: 700, color: G.ink, margin: 0 }}>
                          {t('booking.havePromo')}
                        </p>
                      </div>
                      <CouponInput hotelId={hotelId} room={room} checkIn={checkIn}
                        baseAmount={baseAmount} onApplied={setCouponResult} />
                    </div>

                    {/* Reserve CTA */}
                    <motion.button onClick={handleLock} disabled={isLocking} whileTap={{ scale: 0.99 }}
                      style={{
                        width: '100%', padding: '16px 0', borderRadius: 20, border: 'none',
                        background: G.ink, color: '#fff', fontSize: 15, fontWeight: 700,
                        cursor: isLocking ? 'not-allowed' : 'pointer', opacity: isLocking ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'background .2s, opacity .2s',
                      }}
                      onMouseEnter={e => { if (!isLocking) e.currentTarget.style.background = G.gold; }}
                      onMouseLeave={e => e.currentTarget.style.background = G.ink}>
                      {isLocking ? (
                        <>
                          <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)',
                                        borderTopColor: '#fff', borderRadius: '50%',
                                        animation: 'spin .7s linear infinite' }} />
                          {t('booking.reservingRoom')}
                        </>
                      ) : (
                        <>
                          <Lock style={{ width: 17, height: 17 }} />
                          {t('booking.reserveRoom')}
                          {isRtl
                            ? <ChevronLeft  style={{ width: 15, height: 15, opacity: 0.7 }} />
                            : <ChevronRight style={{ width: 15, height: 15, opacity: 0.7 }} />}
                        </>
                      )}
                    </motion.button>

                    <p style={{ textAlign: 'center', fontSize: 12, color: G.ink3 }}>
                      {t('booking.checkout.holdNotice')}
                    </p>
                  </motion.div>
                )}

                {/* ── STEP 2 ── */}
                {step === 2 && currentLock && (
                  <motion.div key="s2"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Confirmation badge */}
                    <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${G.border}`,
                                  padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#f0fdf4',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      flexShrink: 0 }}>
                          <Check style={{ width: 22, height: 22, color: '#16a34a' }} />
                        </div>
                        <div>
                          <h3 style={{ fontWeight: 700, color: G.ink, margin: 0, fontSize: 18 }}>
                            {t('booking.roomReserved')}
                          </h3>
                          <p style={{ fontSize: 13, color: G.ink3, marginTop: 4 }}>
                            {t('booking.checkout.roomReservedSubtitle')}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
                        <div style={{ background: G.surface, borderRadius: 16, padding: 14 }}>
                          <p style={{ fontSize: 11, color: G.ink3, margin: '0 0 4px' }}>
                            {t('booking.confirmationCode')}
                          </p>
                          <p style={{ fontFamily: 'monospace', fontWeight: 900, color: G.gold,
                                      fontSize: 18, letterSpacing: '.1em', margin: 0 }}>
                            {currentLock.booking.confirmationCode}
                          </p>
                        </div>
                        <div style={{ background: G.surface, borderRadius: 16, padding: 14 }}>
                          <p style={{ fontSize: 11, color: G.ink3, margin: '0 0 4px' }}>
                            {t('booking.guestName')}
                          </p>
                          <p style={{ fontWeight: 700, color: G.ink, fontSize: 13, margin: 0 }}>
                            {guestDetails.firstName} {guestDetails.lastName}
                          </p>
                          <p style={{ fontSize: 11, color: G.ink3, margin: '2px 0 0',
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {guestDetails.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment method */}
                    <div style={{ background: '#fff', borderRadius: 24, border: `1.5px solid ${G.border}`,
                                  padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
                                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: G.goldBg,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CreditCard style={{ width: 17, height: 17, color: G.gold }} />
                        </div>
                        <div>
                          <h2 style={{ fontWeight: 700, color: G.ink, margin: 0, fontSize: 16 }}>
                            {t('booking.paymentMethod')}
                          </h2>
                          <p style={{ fontSize: 12, color: G.ink3, marginTop: 2 }}>
                            {t('booking.checkout.paymentSubtitle')}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {PAYMENT_OPTIONS.map(opt => (
                          <PaymentOption key={opt.value} {...opt}
                            selected={paymentMethod === opt.value}
                            onSelect={() => setPaymentMethod(opt.value)} />
                        ))}
                      </div>

                      <AnimatePresence>
                        {paymentMethod === 'partial_30' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: 14, background: '#eff6ff', border: '1px solid #bfdbfe',
                                          borderRadius: 16, fontSize: 13 }}>
                              <p style={{ fontWeight: 700, color: '#1d4ed8', margin: '0 0 4px' }}>
                                {t('booking.checkout.depositRequired')}
                              </p>
                              <p style={{ color: '#3b82f6', fontSize: 12, margin: 0 }}>
                                {t('booking.checkout.depositHelp')}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Confirm button */}
                      <motion.button onClick={handleConfirm} disabled={isConfirming} whileTap={{ scale: 0.99 }}
                        style={{
                          width: '100%', padding: '16px 0', borderRadius: 20, border: 'none',
                          background: G.ink, color: '#fff', fontSize: 15, fontWeight: 700,
                          cursor: isConfirming ? 'not-allowed' : 'pointer', opacity: isConfirming ? 0.7 : 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', transition: 'background .2s, opacity .2s',
                        }}
                        onMouseEnter={e => { if (!isConfirming) e.currentTarget.style.background = G.gold; }}
                        onMouseLeave={e => e.currentTarget.style.background = G.ink}>
                        {isConfirming ? (
                          <>
                            <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,.3)',
                                          borderTopColor: '#fff', borderRadius: '50%',
                                          animation: 'spin .7s linear infinite' }} />
                            {t('booking.submitting')}
                          </>
                        ) : (
                          <>
                            <Check style={{ width: 18, height: 18 }} />
                            {t('booking.checkout.confirmBooking')}
                          </>
                        )}
                      </motion.button>

                      <p style={{ textAlign: 'center', fontSize: 12, color: G.ink3 }}>
                        {t('booking.approvalMessage')}
                      </p>
                    </div>

                    {/* Edit details */}
                    <button
                      onClick={() => { dispatch(clearLock()); setStep(1); }}
                      style={{ width: '100%', padding: '12px 0', fontSize: 13, color: G.ink3,
                               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                               background: 'none', border: 'none', cursor: 'pointer', transition: 'color .15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = G.ink}
                      onMouseLeave={e => e.currentTarget.style.color = G.ink3}>
                      {isRtl
                        ? <ChevronRight style={{ width: 15, height: 15 }} />
                        : <ChevronLeft  style={{ width: 15, height: 15 }} />}
                      {t('booking.editDetails')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Summary sidebar */}
            <div className="lg:sticky lg:top-8">
              <BookingSummary room={room} hotel={hotel}
                checkIn={checkIn} checkOut={checkOut}
                adults={adults}
                couponResult={couponResult}
                onRemoveCoupon={() => setCouponResult(null)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}