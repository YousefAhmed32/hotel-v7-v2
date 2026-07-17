import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MapPin, Phone, Globe, Users, BedDouble, Check, Calendar,
  ChevronLeft, ChevronRight, X, Wifi, Wind, Coffee, Shield,
  Eye, Maximize2, ArrowRight, ArrowLeft, Clock, Sparkles,
} from 'lucide-react';
import { fetchHotelById, selectCurrentHotel, selectHotelsLoading } from '@/features/hotel/hotelSlice';
import { fetchRooms, selectRooms } from '@/features/room/roomSlice';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { ReviewCard } from '@/components/customer/ReviewCard';
import { LoadingSpinner, PageLoader } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatRating } from '@/utils/formatters';
import { reviewApi } from '@/services/reviewApi';
import { ChatWidget } from '@/components/customer/ChatWidget';
import { DateRangePicker } from '@/components/customer/DateRangePicker';

/* ── Brand tokens ── */
const G = {
  gold:     '#f6a003',
  goldDark: '#d98902',
  goldBg:   '#fff8ed',
  goldRing: '#fde68a',
  goldText: '#b45309',
  surface:  '#faf8f5',
  border:   '#f0ece4',
  ink:      '#2a2218',
  ink2:     '#4a3f30',
  ink3:     '#9a8e7e',
  ink4:     '#b0a898',
};

/* ── Amenity icon map ── */
const AMENITY_ICONS = { wifi: Wifi, aircon: Wind, coffee: Coffee, safe: Shield, tv: Eye };
const AmenityIcon = ({ name }) => {
  const Icon = AMENITY_ICONS[name?.toLowerCase()] || Check;
  return <Icon style={{ width: 14, height: 14 }} />;
};

/* ── Star row ── */
const Stars = ({ count = 5, filled = 5, size = 14 }) =>
  Array.from({ length: count }).map((_, i) => (
    <svg key={i} width={size} height={size} viewBox="0 0 24 24"
      fill={i < Math.round(filled) ? G.gold : '#e5e5e5'} style={{ flexShrink: 0 }}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ));

/* ─── HeroGallery ─── */
const HeroGallery = ({ hotel }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const images = hotel.images?.length ? hotel.images : hotel.coverImage ? [hotel.coverImage] : [];
  const [active, setActive]           = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const prev = () => setActive(i => (i - 1 + images.length) % images.length);
  const next = () => setActive(i => (i + 1) % images.length);

  const navBtn = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(255,255,255,.92)', border: 'none', cursor: 'pointer', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,.18)', transition: 'background .15s, transform .15s',
  };

  return (
    <>
      <div style={{ position: 'relative', width: '100%', height: 'clamp(280px,45vw,560px)',
                    overflow: 'hidden', background: '#f5f1eb' }}>
        {images.length > 0 ? (
          <>
            <AnimatePresence mode="sync">
              <motion.img key={active} src={`/api/v1/media/${images[active]}`} alt={hotel.name}
                initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </AnimatePresence>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                          background: 'linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 55%)' }} />

            {images.length > 1 && (
              <>
                <button
                  onClick={isRtl ? next : prev}
                  style={{ ...navBtn, [isRtl ? 'right' : 'left']: 16 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.92)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                  <ChevronLeft style={{ width: 20, height: 20, color: '#3a3020' }} />
                </button>
                <button
                  onClick={isRtl ? prev : next}
                  style={{ ...navBtn, [isRtl ? 'left' : 'right']: 16 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.92)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                  <ChevronRight style={{ width: 20, height: 20, color: '#3a3020' }} />
                </button>

                <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                              display: 'flex', gap: 6, zIndex: 10 }}>
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setActive(i)}
                      style={{ border: 'none', cursor: 'pointer', padding: 0, borderRadius: 999,
                               transition: 'all .2s', height: 8,
                               width: i === active ? 24 : 8,
                               background: i === active ? G.gold : 'rgba(255,255,255,.55)' }} />
                  ))}
                </div>

                <button onClick={() => setLightboxOpen(true)}
                  style={{
                    position: 'absolute', bottom: 18, [isRtl ? 'left' : 'right']: 16,
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,.9)',
                    border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#3a3020',
                    boxShadow: '0 2px 10px rgba(0,0,0,.15)',
                  }}>
                  <Maximize2 style={{ width: 13, height: 13 }} />
                  {active + 1} / {images.length}
                </button>
              </>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', background: 'linear-gradient(135deg,#fdf6e8,#f5ead0)' }}>
            <span style={{ fontSize: 96, color: '#e8d5a8', fontFamily: 'Playfair Display,Georgia,serif',
                           userSelect: 'none' }}>{hotel.name?.[0]}</span>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.96)', zIndex: 50,
                     display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setLightboxOpen(false)}>
            <button onClick={() => setLightboxOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
                       cursor: 'pointer', color: 'rgba(255,255,255,.7)' }}>
              <X style={{ width: 28, height: 28 }} />
            </button>
            <button onClick={e => { e.stopPropagation(); isRtl ? next() : prev(); }}
              style={{ position: 'absolute', [isRtl ? 'right' : 'left']: 16, top: '50%',
                       transform: 'translateY(-50%)', background: 'none', border: 'none',
                       cursor: 'pointer', color: 'rgba(255,255,255,.7)' }}>
              <ChevronLeft style={{ width: 36, height: 36 }} />
            </button>
            <motion.img key={active} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }}
              src={`/api/v1/media/${images[active]}`} alt=""
              onClick={e => e.stopPropagation()}
              style={{ maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain', borderRadius: 12 }} />
            <button onClick={e => { e.stopPropagation(); isRtl ? prev() : next(); }}
              style={{ position: 'absolute', [isRtl ? 'left' : 'right']: 16, top: '50%',
                       transform: 'translateY(-50%)', background: 'none', border: 'none',
                       cursor: 'pointer', color: 'rgba(255,255,255,.7)' }}>
              <ChevronRight style={{ width: 36, height: 36 }} />
            </button>
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                          display: 'flex', gap: 6 }}>
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setActive(i); }}
                  style={{ border: 'none', cursor: 'pointer', padding: 0, borderRadius: 999,
                           transition: 'all .2s', height: 7,
                           width: i === active ? 20 : 7,
                           background: i === active ? G.gold : 'rgba(255,255,255,.4)' }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── RoomImageCarousel ─── */
const RoomImageCarousel = ({ room }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const images = room.images?.length ? room.images : room.coverImage ? [room.coverImage] : [];
  const [idx, setIdx] = useState(0);

  if (!images.length) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', background: '#f5f1eb' }}>
      <BedDouble style={{ width: 40, height: 40, color: '#d4c9b5' }} />
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
         className="group">
      <AnimatePresence mode="sync">
        <motion.img key={idx} src={`/api/v1/media/${images[idx]}`} alt={room.name}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </AnimatePresence>
      {images.length > 1 && (
        <>
          {[
            { side: isRtl ? 'right' : 'left', icon: ChevronLeft,  dir: isRtl ? 1 : -1 },
            { side: isRtl ? 'left'  : 'right', icon: ChevronRight, dir: isRtl ? -1 : 1 },
          ].map(({ side, icon: Icon, dir }) => (
            <button key={side}
              onClick={e => { e.stopPropagation(); setIdx(i => (i + dir + images.length) % images.length); }}
              style={{
                position: 'absolute', [side]: 8, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity .2s',
                boxShadow: '0 1px 6px rgba(0,0,0,.18)', color: '#3a3020',
              }}
              className="group-hover:opacity-100">
              <Icon style={{ width: 15, height: 15 }} />
            </button>
          ))}
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                        display: 'flex', gap: 4 }}>
            {images.map((_, i) => (
              <span key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                style={{ display: 'block', cursor: 'pointer', borderRadius: 999, transition: 'all .2s',
                         height: 6, width: i === idx ? 16 : 6,
                         background: i === idx ? G.gold : 'rgba(255,255,255,.65)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ─── RoomDrawer ─── */
const RoomDrawer = ({ room, onClose, onBook, checkIn, checkOut }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  if (!room) return null;
  const images = room.images?.length ? room.images : room.coverImage ? [room.coverImage] : [];
  const [activeImg, setActiveImg] = useState(0);
  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000) : 0;

  return (
    <AnimatePresence>
      {room && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(30,20,10,.4)',
                   backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end',
                   justifyContent: 'center' }}
          className="md:items-center md:p-6"
          onClick={onClose}>
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', width: '100%', maxWidth: 720,
                     borderRadius: '20px 20px 0 0', overflow: 'hidden',
                     boxShadow: '0 -8px 40px rgba(0,0,0,.18)',
                     maxHeight: '92vh', overflowY: 'auto' }}
            className="md:rounded-2xl md:max-h-[88vh]"
            dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Image */}
            <div style={{ position: 'relative', height: 260, background: '#f5f1eb', flexShrink: 0 }}>
              {images.length > 0 ? (
                <>
                  <AnimatePresence mode="sync">
                    <motion.img key={activeImg} src={`/api/v1/media/${images[activeImg]}`} alt={room.name}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  </AnimatePresence>
                  {images.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 12, left: '50%',
                                  transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setActiveImg(i)}
                          style={{ border: 'none', cursor: 'pointer', padding: 0, borderRadius: 999,
                                   transition: 'all .2s', height: 7,
                                   width: i === activeImg ? 20 : 7,
                                   background: i === activeImg ? G.gold : 'rgba(255,255,255,.65)' }} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <BedDouble style={{ width: 56, height: 56, color: '#d4c9b5' }} />
                </div>
              )}
              <button onClick={onClose}
                style={{
                  position: 'absolute', top: 12, [isRtl ? 'left' : 'right']: 12,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,.92)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,.18)',
                }}>
                <X style={{ width: 16, height: 16, color: '#6b6b6b' }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start',
                            justifyContent: 'space-between', marginBottom: 4, gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 19, fontWeight: 700, color: G.ink, margin: 0,
                               fontFamily: 'Playfair Display,serif' }}>{room.name}</h2>
                  <p style={{ fontSize: 12, color: G.ink3, marginTop: 3, textTransform: 'capitalize' }}>
                    {room.type}
                    {room.floor    ? ` · ${t('roomDetail.floorShort')} ${room.floor}` : ''}
                    {room.roomNumber ? ` · #${room.roomNumber}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: isRtl ? 'left' : 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: G.gold, margin: 0, lineHeight: 1 }}>
                    {formatCurrency(room.basePrice)}
                  </p>
                  <p style={{ fontSize: 11, color: G.ink4, marginTop: 3 }}>{t('common.perNight')}</p>
                </div>
              </div>

              {/* Specs grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, margin: '16px 0' }}>
                {[
                  { label: t('common.guests'), value: `${room.maxAdults} ${t('common.adults')}${room.maxChildren ? `, ${room.maxChildren} ${t('common.children')}` : ''}` },
                  { label: t('rooms.beds'),    value: room.beds?.map(b => `${b.count} ${b.type}`).join(', ') || 'Queen' },
                  { label: t('rooms.size'),    value: room.sizeM2 ? `${room.sizeM2} m²` : room.view !== 'none' ? `${room.view} view` : t('roomDetail.comfortable') },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: G.surface, borderRadius: 12,
                                            padding: '10px 12px', textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: G.ink4, marginBottom: 4, textTransform: 'uppercase',
                                letterSpacing: '.05em', fontWeight: 700 }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: G.ink2,
                                textTransform: 'capitalize', margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {room.description && (
                <p style={{ fontSize: 13, color: '#7a6e62', lineHeight: 1.7, marginBottom: 16 }}>
                  {room.description}
                </p>
              )}

              {room.amenities?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: G.ink4, textTransform: 'uppercase',
                              letterSpacing: '.07em', marginBottom: 8 }}>
                    {t('rooms.roomAmenities')}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {room.amenities.map(a => (
                      <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 5,
                                             padding: '5px 11px', borderRadius: 20,
                                             background: '#f5f1eb', color: '#6b5e4a',
                                             fontSize: 12, textTransform: 'capitalize' }}>
                        <AmenityIcon name={a} />{a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price breakdown */}
              {checkIn && checkOut && nights > 0 && (
                <div style={{ borderRadius: 16, padding: 16, marginBottom: 18,
                              background: G.goldBg, border: `1.5px solid ${G.goldRing}` }}>
                  {[
                    { label: `${formatCurrency(room.basePrice)} × ${nights} ${t('common.nights')}`, value: formatCurrency(room.basePrice * nights) },
                    { label: t('rooms.taxes'),                                                        value: formatCurrency(room.basePrice * nights * .14) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                                             fontSize: 13, color: '#7a6e62', marginBottom: 6 }}>
                      <span>{label}</span><span>{value}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${G.goldRing}`, paddingTop: 10, marginTop: 6,
                                display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: G.ink2 }}>{t('rooms.totalPrice')}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: G.goldDark }}>
                      {formatCurrency(room.basePrice * nights * 1.14)}
                    </span>
                  </div>
                </div>
              )}

              {/* Book button */}
              <button onClick={() => onBook(room._id)}
                style={{
                  width: '100%', padding: '14px 0',
                  background: `linear-gradient(135deg, ${G.gold}, ${G.goldDark})`,
                  color: '#fff', border: 'none', borderRadius: 14,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: `0 4px 16px ${G.gold}40`, transition: 'opacity .15s, transform .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                onMouseDown={e  => e.currentTarget.style.transform = 'scale(.98)'}
                onMouseUp={e    => e.currentTarget.style.transform = 'scale(1)'}
              >
                {checkIn && checkOut ? t('hotelDetail.bookThisRoom') : t('rooms.selectThisRoom')}
                {isRtl ? <ArrowLeft style={{ width: 18, height: 18 }} /> : <ArrowRight style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── RoomCard ─── */
const RoomCard = ({ room, onDetails, onBook, checkIn, checkOut }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${G.border}`,
               overflow: 'hidden', transition: 'box-shadow .25s, border-color .25s', cursor: 'pointer' }}
      whileHover={{ y: -3, boxShadow: '0 14px 36px rgba(0,0,0,.09)', borderColor: '#e0d6c8' }}
      onClick={() => onDetails(room)}
    >
      <div style={{ height: 200, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        <RoomImageCarousel room={room} />
        <div style={{ position: 'absolute', top: 12, [isRtl ? 'right' : 'left']: 12 }}>
          <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,.92)', color: G.ink2,
                         fontSize: 11, fontWeight: 600, borderRadius: 20, textTransform: 'capitalize',
                         boxShadow: '0 1px 6px rgba(0,0,0,.12)' }}>
            {t(`rooms.${room.type}`) || room.type}
          </span>
        </div>
        {room.aiSuggestedPrice && room.aiSuggestedPrice !== room.basePrice && (
          <div style={{ position: 'absolute', top: 12, [isRtl ? 'left' : 'right']: 12,
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                        borderRadius: 20, background: G.gold, color: '#fff', fontSize: 11, fontWeight: 700 }}>
            <Sparkles style={{ width: 12, height: 12 }} /> {t('rooms.aiPriced')}
          </div>
        )}
      </div>

      <div style={{ padding: '16px 18px 18px' }} dir={isRtl ? 'rtl' : 'ltr'}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      marginBottom: 10, gap: 8 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: G.ink, margin: '0 0 5px',
                         fontFamily: 'Playfair Display,serif' }}>{room.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: G.ink3 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Users style={{ width: 11, height: 11 }} />{room.maxAdults} {t('common.adults')}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <BedDouble style={{ width: 11, height: 11 }} />{room.beds?.[0]?.type || t('rooms.bed')}
              </span>
              {room.sizeM2 && <span>{room.sizeM2} m²</span>}
            </div>
          </div>
          <div style={{ textAlign: isRtl ? 'left' : 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: G.gold, margin: 0, lineHeight: 1 }}>
              {formatCurrency(room.basePrice)}
            </p>
            <p style={{ fontSize: 10, color: G.ink4, margin: '3px 0 0' }}>/ {t('common.night')}</p>
          </div>
        </div>

        {room.amenities?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
            {room.amenities.slice(0, 4).map(a => (
              <span key={a} style={{ padding: '3px 9px', borderRadius: 20, background: G.surface,
                                     color: '#7a6e62', fontSize: 11, textTransform: 'capitalize' }}>{a}</span>
            ))}
            {room.amenities.length > 4 && (
              <span style={{ padding: '3px 9px', borderRadius: 20, background: G.surface,
                             color: G.ink4, fontSize: 11 }}>+{room.amenities.length - 4}</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); onDetails(room); }}
            style={{ flex: 1, padding: '9px 0', borderRadius: 11,
                     border: `1.5px solid #ede8df`, background: '#fff',
                     fontSize: 12, fontWeight: 600, color: '#6b5e4a', cursor: 'pointer',
                     transition: 'border-color .15s, color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.color = G.goldDark; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ede8df'; e.currentTarget.style.color = '#6b5e4a'; }}
          >
            {t('hotelDetail.viewDetails')}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onBook(room._id); }}
            style={{ flex: 1, padding: '9px 0', borderRadius: 11, border: 'none',
                     background: `linear-gradient(135deg, ${G.gold}, ${G.goldDark})`,
                     fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
                     boxShadow: `0 2px 10px ${G.gold}30`,
                     transition: 'opacity .15s, transform .1s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            onMouseDown={e  => e.currentTarget.style.transform = 'scale(.97)'}
            onMouseUp={e    => e.currentTarget.style.transform = 'scale(1)'}
          >
            {t('hotelDetail.bookNow')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
export default function HotelDetailPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const { id }          = useParams();
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const hotel           = useSelector(selectCurrentHotel);
  const rooms           = useSelector(selectRooms);
  const isLoading       = useSelector(selectHotelsLoading);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [reviews,        setReviews]        = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [checkIn,        setCheckIn]        = useState(undefined);
  const [checkOut,       setCheckOut]       = useState(undefined);
  const [selectedRoom,   setSelectedRoom]   = useState(null);
  const [activeTab,      setActiveTab]      = useState('rooms');

  useEffect(() => { dispatch(fetchHotelById(id)); }, [dispatch, id]);

  useEffect(() => {
    if (!hotel?._id) return;
    dispatch(fetchRooms({ hotelId: hotel._id, params: { isActive: 'true', limit: 20 } }));
    reviewApi.getHotelReviews(hotel._id, { limit: 6, sortBy: 'createdAt', sortOrder: 'desc' })
      .then(({ data }) => setReviews(data.data || []))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [hotel, dispatch]);

  const toISO = (d) => d instanceof Date ? d.toISOString().split('T')[0] : '';

  const handleBook = useCallback((roomId) => {
    if (!isAuthenticated) { navigate('/auth/login'); return; }
    if (!checkIn || !checkOut) {
      setActiveTab('rooms');
      document.getElementById('date-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    navigate(`/checkout?hotelId=${hotel._id}&roomId=${roomId}&checkIn=${toISO(checkIn)}&checkOut=${toISO(checkOut)}`);
  }, [isAuthenticated, checkIn, checkOut, hotel, navigate]);

  if (isLoading || !hotel) return <PageLoader />;

  const TABS = [
    { id: 'rooms',     label: t('hotels.detail.tabs.rooms')     },
    { id: 'amenities', label: t('hotels.detail.tabs.amenities') },
    { id: 'reviews',   label: `${t('hotels.detail.tabs.reviews')}${hotel.totalReviews ? ` (${hotel.totalReviews})` : ''}` },
    { id: 'info',      label: t('hotels.detail.tabs.info')      },
  ];

  const minPrice = Math.min(...rooms.map(r => r.basePrice).filter(Boolean), Infinity);
  const nights   = checkIn && checkOut ? Math.round((checkOut - checkIn) / 86400000) : 0;

  /* Policy translated values */
  const policyVal = (key) => {
    if (key === 'pets')    return hotel.policies?.petsAllowed    ? t('hotels.detail.policyValues.allowed')       : t('hotels.detail.policyValues.notAllowed');
    if (key === 'smoking') return hotel.policies?.smokingAllowed ? t('hotels.detail.policyValues.designatedAreas') : t('hotels.detail.policyValues.nonSmoking');
    return '—';
  };

  return (
    <div style={{ minHeight: '100vh', background: G.surface }} dir={isRtl ? 'rtl' : 'ltr'}>
      <HeroGallery hotel={hotel} />

      {/* Sticky title bar */}
      <div style={{ background: '#fff', borderBottom: `1.5px solid ${G.border}`,
                    position: 'sticky', top: 64, zIndex: 30, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                        justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  <Stars count={hotel.starRating || 5} filled={hotel.starRating || 5} size={13} />
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: G.ink, margin: 0,
                             fontFamily: 'Playfair Display,serif' }}>{hotel.name}</h1>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4,
                            color: G.ink3, fontSize: 13 }}>
                <MapPin style={{ width: 13, height: 13, color: G.gold, flexShrink: 0 }} />
                <span>{[hotel.address?.city, hotel.address?.country].filter(Boolean).join(', ')}</span>
              </div>
            </div>
            {hotel.avgRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                            background: G.goldBg, border: `1.5px solid ${G.goldRing}`,
                            borderRadius: 14, flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={G.gold}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 800, color: G.ink, margin: 0, lineHeight: 1 }}>
                    {formatRating(hotel.avgRating)}
                  </p>
                  <p style={{ fontSize: 11, color: G.ink4, margin: '3px 0 0' }}>
                    {hotel.totalReviews} {t('hotels.reviews')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 12, overflowX: 'auto' }}>
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s',
                  ...(activeTab === id
                    ? { background: G.goldBg, color: G.goldDark, boxShadow: `inset 0 -2px 0 ${G.gold}` }
                    : { background: 'transparent', color: G.ink3 }),
                }}
                onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.color = G.gold; }}
                onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.color = G.ink3; }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 64px' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Main content */}
          <div style={{ flex: '1 1 500px', minWidth: 0 }}>

            {/* ── ROOMS TAB ── */}
            {activeTab === 'rooms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Date picker */}
                <div id="date-picker"
                  style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${G.border}`,
                           padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: G.ink2, marginBottom: 12,
                              display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar style={{ width: 15, height: 15, color: G.gold }} />
                    {t('hotelDetail.selectDates')}
                  </p>
                  <DateRangePicker checkIn={checkIn} checkOut={checkOut}
                    onChange={({ checkIn: ci, checkOut: co }) => { setCheckIn(ci); setCheckOut(co); }}
                    placeholder={{ from: t('hotels.checkIn'), to: t('hotels.checkOut') }} />
                  <AnimatePresence>
                    {checkIn && checkOut && nights > 0 && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                                 fontSize: 12, color: G.goldDark, fontWeight: 600 }}>
                        <Check style={{ width: 13, height: 13, color: G.gold }} />
                        {t('hotels.detail.selectedNights', { count: nights })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {rooms.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${G.border}`,
                               padding: '60px 24px', textAlign: 'center' }}>
                    <BedDouble style={{ width: 44, height: 44, color: '#d4c9b5', margin: '0 auto 12px' }} />
                    <p style={{ color: G.ink3, fontSize: 14 }}>{t('hotels.noRooms')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                    {rooms.map(room => (
                      <RoomCard key={room._id} room={room}
                        onDetails={r => navigate(
                          `/hotels/${hotel._id}/rooms/${r._id}` +
                          (checkIn ? `?checkIn=${toISO(checkIn)}&checkOut=${toISO(checkOut)}` : '')
                        )}
                        onBook={handleBook}
                        checkIn={toISO(checkIn)} checkOut={toISO(checkOut)} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── AMENITIES TAB ── */}
            {activeTab === 'amenities' && (
              <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${G.border}`, padding: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: G.ink, marginBottom: 18,
                             fontFamily: 'Playfair Display,serif' }}>
                  {t('hotels.detail.hotelAmenities')}
                </h2>
                {hotel.amenities?.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
                    {hotel.amenities.map(a => (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10,
                                           padding: '11px 14px', borderRadius: 12, background: G.surface,
                                           fontSize: 13, color: G.ink2, textTransform: 'capitalize' }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: G.goldBg,
                                      border: `1.5px solid ${G.goldRing}`, display: 'flex',
                                      alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Check style={{ width: 14, height: 14, color: G.gold }} />
                        </div>
                        {a}
                      </div>
                    ))}
                  </div>
                ) : <p style={{ color: G.ink4, fontSize: 13 }}>{t('hotels.noAmenities')}</p>}
                {hotel.description && (
                  <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${G.border}` }}>
                    <h3 style={{ fontWeight: 700, color: G.ink2, marginBottom: 8, fontSize: 14 }}>
                      {t('hotels.detail.about')}
                    </h3>
                    <p style={{ color: '#7a6e62', fontSize: 13, lineHeight: 1.75, margin: 0 }}>
                      {hotel.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── REVIEWS TAB ── */}
            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reviewsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <LoadingSpinner />
                  </div>
                ) : reviews.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${G.border}`,
                               padding: '60px 24px', textAlign: 'center' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="#d4c9b5"
                         style={{ margin: '0 auto 12px', display: 'block' }}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <p style={{ color: G.ink3, fontSize: 14 }}>{t('hotels.detail.noReviews')}</p>
                  </div>
                ) : reviews.map(r => <ReviewCard key={r._id} review={r} hotelId={hotel._id} />)}
              </div>
            )}

            {/* ── INFO TAB ── */}
            {activeTab === 'info' && (
              <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${G.border}`, padding: 24 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: G.ink, marginBottom: 18,
                             fontFamily: 'Playfair Display,serif' }}>
                  {t('hotels.detail.hotelInfo')}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                  {[
                    { label: t('hotels.detail.info.checkIn'),     value: hotel.policies?.checkInTime  || '14:00', icon: Clock  },
                    { label: t('hotels.detail.info.checkOut'),    value: hotel.policies?.checkOutTime || '12:00', icon: Clock  },
                    { label: t('hotels.detail.info.cancellation'), value: t('hotels.detail.policyValues.noticeHours', { count: hotel.policies?.cancellationHours || 24 }), icon: Shield },
                    { label: t('hotels.detail.info.pets'),        value: policyVal('pets'),    icon: Check },
                    { label: t('hotels.detail.info.smoking'),     value: policyVal('smoking'), icon: Check },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12,
                                             padding: '12px 14px', background: G.surface, borderRadius: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: G.goldBg,
                                    border: `1.5px solid ${G.goldRing}`, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 15, height: 15, color: G.gold }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: G.ink4, textTransform: 'uppercase',
                                    letterSpacing: '.05em', fontWeight: 700, margin: '0 0 3px' }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: G.ink2, margin: 0 }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 16, marginTop: 16, borderTop: `1px solid ${G.border}`,
                              display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {hotel.contact?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: G.ink2 }}>
                      <Phone style={{ width: 15, height: 15, color: G.gold }} />
                      <span>{hotel.contact.phone}</span>
                    </div>
                  )}
                  {hotel.contact?.website && (
                    <a href={hotel.contact.website} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
                               fontWeight: 600, color: G.gold, textDecoration: 'none' }}>
                      <Globe style={{ width: 15, height: 15 }} />
                      {t('hotels.detail.visitWebsite')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ width: '100%', maxWidth: 280, flexShrink: 0 }} className="lg:sticky lg:top-44">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Price card */}
              <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${G.border}`,
                           padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
                <p style={{ fontSize: 12, color: G.ink4, marginBottom: 4, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {t('hotels.startingFrom')}
                </p>
                <p style={{ fontSize: 30, fontWeight: 800, color: G.gold, margin: '0 0 2px',
                            lineHeight: 1, fontFamily: 'Playfair Display,serif' }}>
                  {formatCurrency(minPrice === Infinity ? 0 : minPrice)}
                </p>
                <p style={{ fontSize: 11, color: G.ink4, margin: '0 0 16px' }}>
                  {t('common.perNight')} · {t('common.taxesExtra')}
                </p>
                <button onClick={() => setActiveTab('rooms')}
                  style={{
                    width: '100%', padding: '13px 0',
                    background: `linear-gradient(135deg, ${G.gold}, ${G.goldDark})`,
                    color: '#fff', border: 'none', borderRadius: 13,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: `0 4px 16px ${G.gold}40`, transition: 'opacity .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  {t('hotels.detail.browseRooms')}
                  {isRtl ? <ArrowLeft style={{ width: 16, height: 16 }} /> : <ArrowRight style={{ width: 16, height: 16 }} />}
                </button>
              </div>

              {/* Rating card */}
              {hotel.avgRating > 0 && (
                <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${G.border}`, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: G.ink, lineHeight: 1,
                                   fontFamily: 'Playfair Display,serif' }}>
                      {formatRating(hotel.avgRating)}
                    </span>
                    <div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 3 }}>
                        <Stars count={5} filled={hotel.avgRating} size={13} />
                      </div>
                      <p style={{ fontSize: 11, color: G.ink4, margin: 0 }}>
                        {hotel.totalReviews} {t('hotels.reviews')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('reviews')}
                    style={{ fontSize: 12, fontWeight: 600, color: G.gold,
                             background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {t('hotels.detail.readAllReviews')} →
                  </button>
                </div>
              )}

              {/* Free cancellation */}
              <div style={{ borderRadius: 14, padding: '12px 16px', background: G.goldBg,
                           border: `1.5px solid ${G.goldRing}` }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: G.goldText, margin: '0 0 3px' }}>
                  {t('hotels.freeCancellation')}
                </p>
                <p style={{ fontSize: 12, color: G.gold, margin: 0 }}>
                  {t('hotels.detail.freeCancellationHours', { count: hotel.policies?.cancellationHours || 24 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RoomDrawer room={selectedRoom} onClose={() => setSelectedRoom(null)}
        onBook={handleBook} checkIn={toISO(checkIn)} checkOut={toISO(checkOut)} />
      <ChatWidget hotel={hotel} />
    </div>
  );
}