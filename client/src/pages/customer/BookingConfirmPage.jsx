import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, BedDouble, MapPin, Download, Share2, ArrowRight, Star, MessageCircle } from 'lucide-react';
import { formatCurrency, formatDate, formatNights } from '@/utils/formatters';
import api from '@/services/api';
import { PageLoader } from '@/components/common/LoadingSpinner';
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

export default function BookingConfirmPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get('/bookings/my', { params: { limit: 50 } })
      .then(({ data }) => {
        const found = (data.data || []).find(b => b._id === id);
        if (found) setBooking(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;

  const nights = booking
    ? Math.max(1, Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000))
    : 0;

  const adultCount = booking?.adults || 1;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${G.goldBg} 0%, #fff 50%, ${G.surface} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', paddingTop: 48, paddingBottom: 48,
    }}
    dir={isRtl ? 'rtl' : 'ltr'}>
      <div style={{ width: '100%', maxWidth: 800 }}>

        {/* ── Success Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          style={{ textAlign: 'center', marginBottom: 32 }}>

          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: '#f0fdf4', border: '4px solid #bbf7d0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}>
            <CheckCircle style={{ width: 40, height: 40, color: '#16a34a' }} />
          </div>

          <h1 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 700,
            color: G.ink, margin: 0, fontFamily: 'Playfair Display, Georgia, serif',
          }}>
            {t('bookingConfirm.bookingConfirmed')}
          </h1>

          <p style={{
            fontSize: 14, color: G.ink3, marginTop: 8, marginBottom: 16,
          }}>
            {t('bookingConfirm.pendingApproval')}
          </p>

          {booking?.confirmationCode && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 12, paddingLeft: 16, paddingRight: 16,
              paddingTop: 8, paddingBottom: 8,
              background: G.goldBg, border: `1px solid ${G.goldRing}`,
              borderRadius: 12,
            }}>
              <span style={{ fontSize: 11, color: G.goldText, fontWeight: 500 }}>
                {t('bookingConfirm.confirmationCode')}
              </span>
              <span style={{
                fontFamily: 'monospace', fontWeight: 700,
                color: G.goldText, fontSize: 13,
              }}>
                {booking.confirmationCode}
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Booking Details Card ── */}
        {booking && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              background: '#fff', borderRadius: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: `1.5px solid ${G.border}`,
              overflow: 'hidden', marginBottom: 20,
            }}>

            {/* Hotel image */}
            {booking.hotelId?.coverImage && (
              <div style={{ height: 128, overflow: 'hidden' }}>
                <img
                  src={`/api/v1/media/${booking.hotelId.coverImage}`}
                  alt={booking.hotelId?.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            <div style={{
              padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
            }}>

              {/* Hotel & Room Info */}
              <div>
                <p style={{
                  fontSize: 11, color: G.goldText, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.08em', margin: 0,
                }}>
                  {booking.hotelId?.name}
                </p>
                <h2 style={{
                  fontSize: 18, fontWeight: 700, color: G.ink,
                  marginTop: 4, marginBottom: 0, fontFamily: 'Playfair Display, serif',
                }}>
                  {booking.roomId?.name}
                </h2>
                {booking.hotelId?.address && (
                  <p style={{
                    fontSize: 13, color: G.ink3, display: 'flex',
                    alignItems: 'center', gap: 5, marginTop: 6, margin: 0,
                  }}>
                    <MapPin style={{ width: 14, height: 14, flexShrink: 0 }} />
                    {[booking.hotelId.address.city, booking.hotelId.address.country]
                      .filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <div style={{ height: 1, background: G.border }} />

              {/* Stay details grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 10, '@media(min-width:640px)': { gridTemplateColumns: 'repeat(4, 1fr)' },
              }}>
                {[
                  { label: t('hotels.checkIn'),  value: formatDate(booking.checkIn, 'EEE, MMM d') },
                  { label: t('hotels.checkOut'), value: formatDate(booking.checkOut, 'EEE, MMM d') },
                  { label: t('bookingConfirm.duration'), value: t('bookingConfirm.nightsCount', { count: nights }) },
                  { label: t('common.guests'), value: t('bookingConfirm.adultsCount', { count: adultCount }) },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    textAlign: 'center', padding: 12,
                    background: G.surface, borderRadius: 12,
                  }}>
                    <p style={{ fontSize: 11, color: G.ink3, marginBottom: 4, margin: '0 0 4px 0' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: G.ink2, margin: 0 }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ height: 1, background: G.border }} />

              {/* Total & Status */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
              }}>
                <div>
                  <p style={{ fontSize: 11, color: G.ink3, margin: 0 }}>
                    {t('bookingConfirm.totalPaid')}
                  </p>
                  <p style={{
                    fontSize: 28, fontWeight: 700, color: G.gold,
                    margin: '4px 0 0 0', lineHeight: 1,
                  }}>
                    {formatCurrency(booking.pricing?.totalAmount)}
                  </p>
                </div>

                <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                  <p style={{ fontSize: 11, color: G.ink3, margin: 0 }}>
                    {t('bookingConfirm.paymentStatus')}
                  </p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
                    borderRadius: 20, background: '#f0fdf4', border: '1px solid #bbf7d0',
                    color: '#16a34a', fontSize: 13, fontWeight: 600,
                    marginTop: 6, textTransform: 'capitalize',
                  }}>
                    <CheckCircle style={{ width: 14, height: 14 }} />
                    {booking.paymentStatus || t('bookingConfirm.paid')}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Action Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'grid', gridTemplateColumns: '1fr',
            gap: 10, marginBottom: 20,
            '@media(min-width:640px)': { gridTemplateColumns: 'repeat(3, 1fr)' },
          }}>

          {/* My Bookings */}
          <Link to="/profile/bookings"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '12px 0', fontSize: 14, fontWeight: 600,
              background: `linear-gradient(135deg, ${G.gold}, ${G.goldDark})`,
              color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer',
              textDecoration: 'none', boxShadow: `0 4px 16px ${G.gold}40`,
              transition: 'opacity .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Calendar style={{ width: 16, height: 16 }} />
            {t('bookingConfirm.myBookings')}
          </Link>

          {/* Chat with Hotel */}
          {booking?.hotelId?._id && (
            <Link to={`/hotels/${booking.hotelId._id}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '12px 0', fontSize: 14, fontWeight: 600,
                background: '#fff', color: G.ink2, border: `1.5px solid ${G.border}`,
                borderRadius: 14, cursor: 'pointer', textDecoration: 'none',
                transition: 'all .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = G.gold;
                e.currentTarget.style.color = G.goldDark;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = G.border;
                e.currentTarget.style.color = G.ink2;
              }}>
              <MessageCircle style={{ width: 16, height: 16 }} />
              {t('bookingConfirm.chatWithHotel')}
            </Link>
          )}

          {/* More Hotels */}
          <Link to="/hotels"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '12px 0', fontSize: 14, fontWeight: 600,
              background: '#fff', color: G.ink2, border: `1.5px solid ${G.border}`,
              borderRadius: 14, cursor: 'pointer', textDecoration: 'none',
              transition: 'all .2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = G.gold;
              e.currentTarget.style.color = G.goldDark;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = G.border;
              e.currentTarget.style.color = G.ink2;
            }}>
            <BedDouble style={{ width: 16, height: 16 }} />
            {t('bookingConfirm.moreHotels')}
          </Link>
        </motion.div>

        {/* ── Tips Section ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            padding: 16, background: G.goldBg, border: `1.5px solid ${G.goldRing}`,
            borderRadius: 20, fontSize: 13, color: G.goldText,
          }}>

          <p style={{ fontWeight: 600, marginBottom: 6, margin: '0 0 6px 0' }}>
            {t('bookingConfirm.whatsNext')}
          </p>

          <ul style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            color: G.gold, fontSize: 12, margin: 0, paddingLeft: 0,
          }}>
            {[
              t('bookingConfirm.tip1'),
              t('bookingConfirm.tip2'),
              t('bookingConfirm.tip3'),
            ].map((tip, idx) => (
              <li key={idx} style={{ margin: 0, marginLeft: 8 }}>
                • {tip}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}