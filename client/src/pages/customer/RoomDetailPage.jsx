import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, X, Star, Users, BedDouble,
  Maximize2, Check, Calendar, ArrowLeft, ArrowRight,
  Wifi, Wind, Coffee, Shield, Eye, Tv, Bath,
  MapPin, Clock, Sparkles, Share2
} from 'lucide-react';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { roomApi } from '@/services/roomApi';
import api from '@/services/api';
import { reviewApi } from '@/services/reviewApi';
import { formatCurrency, formatDate, formatRating } from '@/utils/formatters';
import { LoadingSpinner, PageLoader } from '@/components/common/LoadingSpinner';
import { ReviewCard } from '@/components/customer/ReviewCard';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

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

/* ── Amenity icons ── */
const AMENITY_ICONS = {
  wifi: Wifi, aircon: Wind, coffee: Coffee, safe: Shield,
  tv: Tv, jacuzzi: Bath, balcony: Eye, bathrobe: Star,
};
const AmenityIcon = ({ name }) => {
  const Icon = AMENITY_ICONS[name?.toLowerCase()] || Check;
  return <Icon className="w-4 h-4" />;
};

/* ── Lightbox ── */
const Lightbox = ({ images, startIdx, onClose }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  isRtl ? next() : prev();
      if (e.key === 'ArrowRight') isRtl ? prev() : next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [idx]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
        {idx + 1} / {images.length}
      </div>

      <button
        onClick={e => { e.stopPropagation(); isRtl ? next() : prev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <motion.img
        key={idx}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        src={`/api/v1/media/${images[idx]}`} alt=""
        onClick={e => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
      />

      <button
        onClick={e => { e.stopPropagation(); isRtl ? prev() : next(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
            style={{
              borderRadius: 999, border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all .2s',
              width: i === idx ? 24 : 8, height: 8,
              background: i === idx ? G.gold : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

/* ── Image Gallery ── */
const ImageGallery = ({ images, roomName }) => {
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState(null);
  const [mainIdx, setMainIdx]   = useState(0);

  if (!images.length) return (
    <div className="h-80 rounded-2xl flex items-center justify-center"
         style={{ background: G.surface }}>
      <BedDouble className="w-16 h-16" style={{ color: G.border }} />
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-4 gap-2 h-[480px]">
        {/* Main image */}
        <div
          className="col-span-3 relative rounded-2xl overflow-hidden group cursor-pointer"
          onClick={() => setLightbox(mainIdx)}
        >
          <motion.img
            key={mainIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            src={`/api/v1/media/${images[mainIdx]}`} alt={roomName}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <button
            onClick={e => { e.stopPropagation(); setLightbox(mainIdx); }}
            className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full shadow transition-all opacity-0 group-hover:opacity-100"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#3a3020' }}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            {t('roomDetail.viewAllPhotos', { count: images.length })}
          </button>
        </div>

        {/* Thumbnails */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {images.slice(1, 5).map((img, i) => (
            <div
              key={img}
              onClick={() => { setMainIdx(i + 1); setLightbox(i + 1); }}
              className="relative flex-1 rounded-xl overflow-hidden cursor-pointer group"
            >
              <img
                src={`/api/v1/media/${img}`} alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {i === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{images.length - 5}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox images={images} startIdx={lightbox} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Booking Sidebar ── */
const BookingSidebar = ({ room, hotel, onBook }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn,  setCheckIn]  = useState('');
  const [checkOut, setCheckOut] = useState('');

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;
  const base  = room.basePrice * Math.max(nights, 1);
  const tax   = Math.round(base * 0.14 * 100) / 100;
  const total = Math.round((base + tax) * 100) / 100;

  const handleBook = () => {
    if (!checkIn || !checkOut) { toast.error(t('roomDetail.selectDatesError')); return; }
    if (nights < 1)            { toast.error(t('validation.checkOutAfterCheckIn')); return; }
    onBook(checkIn, checkOut);
  };

  const inputStyle = {
    width: '100%', fontSize: 14, fontWeight: 600, color: '#111',
    outline: 'none', background: 'transparent', cursor: 'pointer',
    border: 'none',
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 20, border: `1.5px solid ${G.border}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.10)', padding: 24,
      display: 'flex', flexDirection: 'column', gap: 16,
      position: 'sticky', top: 96,
    }}
    dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Price */}
      <div>
        <p style={{ fontSize: 30, fontWeight: 800, color: G.gold, margin: 0, lineHeight: 1 }}>
          {formatCurrency(room.basePrice)}
        </p>
        <p style={{ fontSize: 12, color: G.ink3, marginTop: 4 }}>
          {t('common.perNight')} · {t('common.taxesExtra')}
        </p>
      </div>

      <div style={{ height: 1, background: G.border }} />

      {/* Date picker */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        border: `1.5px solid ${G.border}`, borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: 12, borderRight: `1px solid ${G.border}` }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: G.ink3, textTransform: 'uppercase',
                      letterSpacing: '.08em', marginBottom: 4 }}>
            {t('hotels.checkIn')}
          </p>
          <input type="date" value={checkIn} min={today} style={inputStyle}
            onChange={e => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) setCheckOut('');
            }} />
        </div>
        <div style={{ padding: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: G.ink3, textTransform: 'uppercase',
                      letterSpacing: '.08em', marginBottom: 4 }}>
            {t('hotels.checkOut')}
          </p>
          <input type="date" value={checkOut} min={checkIn || tomorrow} style={inputStyle}
            onChange={e => setCheckOut(e.target.value)} />
        </div>
      </div>

      {/* Price breakdown */}
      {nights > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: `${formatCurrency(room.basePrice)} × ${nights} ${t('common.nights')}`, val: formatCurrency(base) },
            { label: t('rooms.taxes'),                                                       val: formatCurrency(tax)  },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: G.ink3 }}>
              <span>{label}</span><span>{val}</span>
            </div>
          ))}
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontWeight: 700,
            color: G.ink, paddingTop: 8, borderTop: `1px solid ${G.border}`,
          }}>
            <span>{t('rooms.totalPrice')}</span>
            <span style={{ color: G.gold, fontSize: 18 }}>{formatCurrency(total)}</span>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <button onClick={handleBook}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
          background: `linear-gradient(135deg, ${G.gold}, ${G.goldDark})`,
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: `0 4px 16px ${G.gold}40`, transition: 'opacity .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {checkIn && checkOut ? t('roomDetail.reserveNow') : t('rooms.checkAvailability')}
        {isRtl
          ? <ArrowLeft  style={{ width: 18, height: 18 }} />
          : <ArrowRight style={{ width: 18, height: 18 }} />}
      </button>

      <p style={{ textAlign: 'center', fontSize: 11, color: G.ink3 }}>
        {t('roomDetail.noChargeNote')}
      </p>

      {/* Quick specs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                    paddingTop: 12, borderTop: `1px solid ${G.border}` }}>
        {[
          {
            label: t('common.guests'),
            value: `${room.maxAdults} ${t('common.adults')}${room.maxChildren ? `, ${room.maxChildren} ${t('common.children')}` : ''}`,
          },
          {
            label: t('rooms.beds'),
            value: room.beds?.map(b => `${b.count} ${b.type}`).join(', ') || 'Queen',
          },
          {
            label: t('rooms.size'),
            value: room.sizeM2 ? `${room.sizeM2} m²` : '—',
          },
          {
            label: t('rooms.view'),
            value: room.view !== 'none' ? room.view : '—',
          },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: 11, color: G.ink3 }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: G.ink2, textTransform: 'capitalize' }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function RoomDetailPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const { hotelId, roomId } = useParams();
  const navigate            = useNavigate();
  const [searchParams]      = useSearchParams();
  const isAuthenticated     = useSelector(selectIsAuthenticated);

  const [room,    setRoom]    = useState(null);
  const [hotel,   setHotel]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId || !roomId) { navigate(-1); return; }
    Promise.all([
      roomApi.getRoomById(hotelId, roomId),
      api.get('/hotels/' + hotelId),
      api.get('/hotels/' + hotelId + '/reviews', {
        params: { limit: 4, sortBy: 'createdAt', sortOrder: 'desc' },
      }),
    ]).then(([rRes, hRes, revRes]) => {
      setRoom(rRes.data.data.room);
      setHotel(hRes.data.data.hotel);
      setReviews(revRes.data.data || []);
    }).catch(() => navigate(-1))
    .finally(() => setLoading(false));
  }, [hotelId, roomId]);

  const handleBook = useCallback((checkIn, checkOut) => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    navigate(`/checkout?hotelId=${hotelId}&roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}`);
  }, [isAuthenticated, hotelId, roomId, navigate]);

  if (loading) return <PageLoader />;
  if (!room)   return (
    <div className="min-h-screen flex items-center justify-center">
      <p style={{ color: G.ink3 }}>{t('roomDetail.notFound')}</p>
    </div>
  );

  const images = room.images?.length ? room.images : room.coverImage ? [room.coverImage] : [];

  const TYPE_BADGE_STYLES = {
    standard:  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    deluxe:    { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
    suite:     { bg: G.goldBg,  text: G.goldText, border: G.goldRing },
    penthouse: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
    villa:     { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  };
  const badgeSty = TYPE_BADGE_STYLES[room.type] || TYPE_BADGE_STYLES.standard;

  /* Translated policy values */
  const policyValue = (key, hours) => {
    if (key === 'cancellation') return t('hotels.detail.policyValues.noticeHours', { count: hours || 24 });
    if (key === 'pets')    return hotel?.policies?.petsAllowed    ? t('hotels.detail.policyValues.allowed')      : t('hotels.detail.policyValues.notAllowed');
    if (key === 'smoking') return hotel?.policies?.smokingAllowed ? t('hotels.detail.policyValues.designatedAreas') : t('hotels.detail.policyValues.nonSmoking');
    return '—';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f4' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Back bar */}
      <div style={{
        background: '#fff', borderBottom: `1px solid ${G.border}`,
        padding: '0 16px', position: 'sticky', top: 64, zIndex: 30,
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', height: 48,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 500, color: G.ink3,
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = G.gold}
            onMouseLeave={e => e.currentTarget.style.color = G.ink3}
          >
            {isRtl
              ? <ArrowRight style={{ width: 15, height: 15 }} />
              : <ArrowLeft  style={{ width: 15, height: 15 }} />}
            {t('common.back')}
          </button>
          <span style={{ color: G.border }}>·</span>
          {hotel && (
            <Link to={`/hotels/${hotelId}`}
              style={{ fontSize: 13, color: G.ink3, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = G.gold}
              onMouseLeave={e => e.currentTarget.style.color = G.ink3}>
              {hotel.name}
            </Link>
          )}
          <span style={{ color: G.border }}>·</span>
          <span style={{ fontSize: 13, color: G.ink, fontWeight: 500 }}>{room.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Room header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 16, marginBottom: 24, flexWrap: 'wrap',
        }}>
          <div>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                textTransform: 'capitalize',
                background: badgeSty.bg, color: badgeSty.text, border: `1px solid ${badgeSty.border}`,
              }}>
                {t(`rooms.${room.type}`) || room.type}
              </span>
              {room.roomNumber && (
                <span style={{ fontSize: 12, color: G.ink3 }}>
                  {t('roomDetail.roomNumber', { n: room.roomNumber })}
                </span>
              )}
              {room.floor && (
                <span style={{ fontSize: 12, color: G.ink3 }}>
                  {t('roomDetail.floor', { n: room.floor })}
                </span>
              )}
              {room.aiSuggestedPrice && room.aiSuggestedPrice !== room.basePrice && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: G.goldBg, color: G.goldText, border: `1px solid ${G.goldRing}`,
                }}>
                  <Sparkles style={{ width: 11, height: 11 }} /> {t('rooms.aiPriced')}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, color: G.ink,
                         margin: 0, fontFamily: 'Playfair Display, Georgia, serif' }}>
              {room.name}
            </h1>

            {hotel && (
              <Link to={`/hotels/${hotelId}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                         fontSize: 13, color: G.ink3, textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = G.gold}
                onMouseLeave={e => e.currentTarget.style.color = G.ink3}>
                <MapPin style={{ width: 13, height: 13, color: G.gold }} />
                {hotel.name} · {hotel.address?.city}, {hotel.address?.country}
              </Link>
            )}
          </div>

          {/* Share */}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success(t('roomDetail.linkCopied'));
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
              color: G.ink3, border: `1px solid ${G.border}`, background: '#fff',
              padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.goldText; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.ink3; }}
          >
            <Share2 style={{ width: 15, height: 15 }} /> {t('common.share')}
          </button>
        </div>

        {/* Gallery */}
        <div style={{ marginBottom: 32 }}>
          <ImageGallery images={images} roomName={room.name} />
        </div>

        {/* 2-col layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}
             className="lg:!grid-cols-[1fr_320px]">

          {/* Left: details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}
                 className="sm:!grid-cols-4">
              {[
                { icon: Users,     label: t('roomDetail.maxGuests'), value: `${room.maxAdults} ${t('common.adults')}${room.maxChildren ? `, ${room.maxChildren} ${t('common.children')}` : ''}` },
                { icon: BedDouble, label: t('rooms.beds'),            value: room.beds?.map(b => `${b.count} ${b.type}`).join(', ') || '1 Queen' },
                { icon: Maximize2, label: t('rooms.size'),            value: room.sizeM2 ? `${room.sizeM2} m²` : '—' },
                { icon: Eye,       label: t('rooms.view'),            value: room.view !== 'none' ? room.view : t('rooms.noView') },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  background: '#fff', borderRadius: 18, border: `1px solid ${G.border}`,
                  padding: '16px 12px', textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: G.goldBg, border: `1.5px solid ${G.goldRing}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}>
                    <Icon style={{ width: 18, height: 18, color: G.gold }} />
                  </div>
                  <p style={{ fontSize: 11, color: G.ink3, marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: G.ink, textTransform: 'capitalize' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {room.description && (
              <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${G.border}`, padding: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: G.ink, marginBottom: 12 }}>
                  {t('roomDetail.aboutRoom')}
                </h2>
                <p style={{ color: G.ink2, lineHeight: 1.75, fontSize: 14 }}>{room.description}</p>
              </div>
            )}

            {/* Amenities */}
            {room.amenities?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${G.border}`, padding: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: G.ink, marginBottom: 16 }}>
                  {t('rooms.roomAmenities')}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}
                     className="sm:!grid-cols-3">
                  {room.amenities.map(a => (
                    <div key={a} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: G.surface,
                      borderRadius: 12, border: `1px solid ${G.border}`,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: G.goldBg, border: `1.5px solid ${G.goldRing}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <AmenityIcon name={a} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: G.ink2, textTransform: 'capitalize' }}>
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hotel Policies */}
            {hotel?.policies && (
              <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${G.border}`, padding: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: G.ink, marginBottom: 16 }}>
                  {t('roomDetail.hotelPolicies')}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}
                     className="sm:!grid-cols-3">
                  {[
                    { icon: Clock, label: t('hotels.detail.info.checkIn'),     value: hotel.policies.checkInTime  || '14:00' },
                    { icon: Clock, label: t('hotels.detail.info.checkOut'),    value: hotel.policies.checkOutTime || '12:00' },
                    { icon: Check, label: t('hotels.detail.info.cancellation'),value: policyValue('cancellation', hotel.policies.cancellationHours) },
                    { icon: Check, label: t('hotels.detail.info.pets'),        value: policyValue('pets') },
                    { icon: Check, label: t('hotels.detail.info.smoking'),     value: policyValue('smoking') },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px 14px', background: G.surface, borderRadius: 12,
                    }}>
                      <Icon style={{ width: 15, height: 15, color: G.gold, flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p style={{ fontSize: 11, color: G.ink3 }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: G.ink2 }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: G.ink, marginBottom: 16 }}>
                  {t('hotels.detail.readAllReviews')}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reviews.map(r => <ReviewCard key={r._id} review={r} hotelId={hotelId} />)}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Link to={`/hotels/${hotelId}#reviews`}
                    style={{ fontSize: 13, fontWeight: 600, color: G.gold, textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.color = G.goldDark}
                    onMouseLeave={e => e.currentTarget.style.color = G.gold}>
                    {t('hotels.detail.readAllReviews')} →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right: booking sidebar */}
          <div>
            <BookingSidebar room={room} hotel={hotel} onBook={handleBook} />
          </div>
        </div>
      </div>
    </div>
  );
}