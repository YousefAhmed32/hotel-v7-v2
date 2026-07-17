import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Shield, Award, ChevronRight, ChevronLeft,
  MapPin, ArrowRight, CheckCircle, Wifi, Car,
  Utensils, Waves, Sparkles, Quote,
} from 'lucide-react';
import {
  fetchHotels,
  selectHotels,
  selectHotelsLoading,
} from '@/features/hotel/hotelSlice';
import { SearchBar } from '@/components/customer/SearchBar';
import { HotelCard } from '@/components/customer/HotelCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/* ─────────────────────────────────────────────────
   Animation helpers
───────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
});

const inView = (delay = 0) => ({
  initial:      { opacity: 0, y: 24 },
  whileInView:  { opacity: 1, y: 0  },
  viewport:     { once: true, margin: '-60px' },
  transition:   { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
});

const slideVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: ()    => ({ opacity: 1, x: 0 }),
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

/* ─────────────────────────────────────────────────
   Static image/icon data  (text comes from i18n)
───────────────────────────────────────────────── */
const HERO_IMAGES = [
  { img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1800&q=90', key: 'cairo'   },
  { img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1800&q=90', key: 'hurghada' },
  { img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1800&q=90', key: 'sharm'  },
  { img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1800&q=90', key: 'alex'    },
];

const LOCATION_IMAGES = [
  { key: 'cairo',   img: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=85', rooms: 48 },
  { key: 'sharm',   img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=85', rooms: 54 },
  { key: 'hurghada',img: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800&q=85', rooms: 62 },
];

const EXPERIENCE_DATA = [
  { key: 'pools',  icon: Waves,     img: 'https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=600&q=80' },
  { key: 'spa',    icon: Sparkles,  img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80' },
  { key: 'dining', icon: Utensils,  img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
  { key: 'beach',  icon: Waves,     img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
];

const FEATURE_ICONS = [Star, Shield, Award, Wifi, Car, CheckCircle];
const FEATURE_KEYS  = ['luxury', 'booking', 'rate', 'connectivity', 'transfers', 'confirmation'];

const TESTIMONIAL_DATA = [
  { key: 'sarah', avatar: 'https://i.pravatar.cc/80?img=47', rating: 5 },
  { key: 'james', avatar: 'https://i.pravatar.cc/80?img=12', rating: 5 },
  { key: 'nadia', avatar: 'https://i.pravatar.cc/80?img=31', rating: 5 },
];

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function HomePage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const dispatch  = useDispatch();
  const hotels    = useSelector(selectHotels);
  const isLoading = useSelector(selectHotelsLoading);

  const [slide, setSlide]         = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  const goTo = (idx) => { setDirection(idx > slide ? 1 : -1); setSlide(idx); };
  const prev = () => goTo((slide - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  const next = () => goTo((slide + 1) % HERO_IMAGES.length);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setSlide(s => (s + 1) % HERO_IMAGES.length);
    }, 6000);
  };
  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current); }, []);

  useEffect(() => {
    dispatch(fetchHotels({ page: 1, limit: 6, sortBy: 'avgRating', sortOrder: 'desc' }));
  }, [dispatch]);

  /* ─── Brand tokens ─── */
  const brand       = '#f6a003';
  const brandDark   = '#d98902';
  const brandLight  = '#fff7e6';
  const brandBorder = '#fcd97a';
  const brandMuted  = '#fef3d0';
  const ink   = '#111111';
  const ink2  = '#444444';
  const ink3  = '#888888';
  const surface  = '#fafaf9';
  const bdColor  = '#e8e5e0';

  /* Current slide keys */
  const currentSlide = HERO_IMAGES[slide];
  const slideKey     = currentSlide.key;

  /* Helper to get hero slide text — fallback gracefully */
  const heroT = (field) => {
    const key = `home.hero.slides.${slideKey}.${field}`;
    const val = t(key);
    return val === key ? '' : val; // if key missing, return empty
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        .lux-serif { font-family: 'Cormorant Garamond', Georgia, serif !important; }
        .lux-sans  { font-family: 'DM Sans', system-ui, sans-serif !important; }
        .lux-page  { font-family: 'DM Sans', system-ui, sans-serif; background: ${surface}; color: ${ink}; }
        .lux-page > *:first-child { margin-top: 0 !important; padding-top: 0 !important; }

        .brand-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: ${brandDark}; background: ${brandLight}; border: 1px solid ${brandBorder};
          padding: 5px 14px; border-radius: 100px;
        }
        .section-line { width: 44px; height: 3px; background: ${brand}; border-radius: 4px; }

        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: ${brand}; color: #111; font-weight: 700; border-radius: 12px;
          border: none; cursor: pointer; text-decoration: none;
          box-shadow: 0 6px 22px rgba(246,160,3,0.32);
          transition: background .2s, transform .15s, box-shadow .2s;
        }
        .btn-primary:hover { background: ${brandDark}; transform: translateY(-1px); box-shadow: 0 10px 32px rgba(246,160,3,0.40); }
        .btn-primary:active { transform: translateY(0); }

        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          border: 1.5px solid rgba(255,255,255,0.28); color: #fff; font-weight: 600;
          border-radius: 12px; cursor: pointer; text-decoration: none; background: transparent;
          transition: background .2s, border-color .2s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.5); }

        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          border: 1.5px solid ${bdColor}; color: ${ink2}; font-weight: 600;
          border-radius: 12px; cursor: pointer; text-decoration: none; background: #fff;
          transition: border-color .2s, color .2s;
        }
        .btn-outline:hover { border-color: ${brand}; color: ${brandDark}; }

        .loc-card img { transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .loc-card:hover img { transform: scale(1.06) !important; }

        .exp-card img { transition: transform 0.65s cubic-bezier(0.22,1,0.36,1); }
        .exp-card:hover img { transform: scale(1.09) !important; }

        .feat-card { transition: border-color .25s, background .25s, transform .25s; }
        .feat-card:hover { border-color: ${brandBorder} !important; background: ${brandMuted} !important; transform: translateY(-3px); }
        .feat-card:hover .feat-ico { background: ${brand} !important; border-color: ${brand} !important; }
        .feat-card:hover .feat-ico svg { color: #111 !important; }

        .testi-card { transition: transform .3s, box-shadow .3s; }
        .testi-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.09); }

        .slide-dot { border: none; cursor: pointer; padding: 0; border-radius: 100px; transition: all .3s; }

        @media (max-width:640px) {
          .hero-h { font-size: clamp(1.9rem, 9vw, 3rem) !important; }
          .section-h { font-size: clamp(1.7rem, 7vw, 2.6rem) !important; }
        }
      `}</style>

      <div className="lux-page min-h-screen" dir={isRtl ? 'rtl' : 'ltr'}>

        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section style={{
          position: 'relative', overflow: 'hidden', background: '#0d0d0d',
          height: 'calc(100svh)', minHeight: 540, maxHeight: 920,
        }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={slide} custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <img src={currentSlide.img} alt={heroT('tag')}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.26) 52%, rgba(0,0,0,0.06) 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0) 60%)' }} />
            </motion.div>
          </AnimatePresence>

          {/* Hero copy */}
          <div style={{
            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', maxWidth: 1280, margin: '0 auto',
            padding: isRtl ? '0 20px 56px' : '0 20px 56px',
          }}>
            <div style={{ maxWidth: 620, ...(isRtl ? { marginRight: 0 } : {}) }}>

              {/* Location tag */}
              <AnimatePresence mode="wait">
                <motion.div key={`tag-${slide}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} style={{ marginBottom: 16 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                    color: '#fff', background: 'rgba(246,160,3,0.22)', border: '1px solid rgba(246,160,3,0.50)',
                    padding: '5px 15px', borderRadius: 100,
                  }}>
                    <MapPin style={{ width: 11, height: 11, color: brand }} />
                    {heroT('tag')}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Headline */}
              <AnimatePresence mode="wait">
                <motion.h1
                  key={`h-${slide}`}
                  className="lux-serif hero-h"
                  style={{
                    color: '#fff', fontWeight: 700, lineHeight: 1.08,
                    letterSpacing: '-0.01em', whiteSpace: 'pre-line', marginBottom: 14,
                    fontSize: 'clamp(2.2rem, 5vw, 4.2rem)',
                    textAlign: isRtl ? 'right' : 'left',
                  }}
                  initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                >
                  {heroT('headline')}
                </motion.h1>
              </AnimatePresence>

              {/* Sub */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={`sub-${slide}`}
                  style={{
                    color: 'rgba(255,255,255,0.68)', marginBottom: 32,
                    fontWeight: 300, lineHeight: 1.7, fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                    maxWidth: 420, textAlign: isRtl ? 'right' : 'left',
                  }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.18 }}
                >
                  {heroT('sub')}
                </motion.p>
              </AnimatePresence>

              {/* CTAs */}
              <motion.div {...fadeUp(0.28)} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
                <Link to="/hotels" className="btn-primary" style={{ padding: '13px 28px', fontSize: 14 }}>
                  {t('home.hero.primaryCta')} <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
                <Link to="/hotels" className="btn-ghost" style={{ padding: '13px 28px', fontSize: 14 }}>
                  {t('home.hero.secondaryCta')} <ChevronRight style={{ width: 16, height: 16 }} />
                </Link>
              </motion.div>

              {/* Dot indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {HERO_IMAGES.map((_, i) => (
                  <button
                    key={i} className="slide-dot"
                    onClick={() => { goTo(i); resetTimer(); }}
                    aria-label={t('home.hero.slideLabel', { index: i + 1 })}
                    style={{ width: i === slide ? 28 : 8, height: 8, background: i === slide ? brand : 'rgba(255,255,255,0.35)' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Prev / Next arrows */}
          {[
            { fn: () => { prev(); resetTimer(); }, Icon: isRtl ? ChevronRight : ChevronLeft,  pos: isRtl ? 'right' : 'left' },
            { fn: () => { next(); resetTimer(); }, Icon: isRtl ? ChevronLeft  : ChevronRight, pos: isRtl ? 'left'  : 'right' },
          ].map(({ fn, Icon, pos }) => (
            <button key={pos} onClick={fn}
              style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)', [pos]: 16,
                width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.22)',
                background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', cursor: 'pointer', transition: 'background .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            >
              <Icon style={{ width: 18, height: 18 }} />
            </button>
          ))}

          {/* Slide counter */}
          <div style={{ position: 'absolute', top: 24, [isRtl ? 'left' : 'right']: 24, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: '.12em' }}>
            {String(slide + 1).padStart(2,'0')} / {String(HERO_IMAGES.length).padStart(2,'0')}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SEARCH PANEL
        ══════════════════════════════════════════ */}
        <section style={{ position: 'relative', zIndex: 10, maxWidth: 1000, margin: '0 auto', padding: '0 16px', marginTop: -36 }}>
          <motion.div {...fadeUp(0)} style={{
            background: '#fff', borderRadius: 20,
            boxShadow: '0 8px 40px rgba(0,0,0,0.13), 0 1px 0 rgba(246,160,3,0.18)',
            border: `1px solid ${bdColor}`, overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px 6px' }}>
              <span className="brand-pill">
                <MapPin style={{ width: 10, height: 10 }} /> {t('home.search.badge')}
              </span>
            </div>
            <div style={{ padding: '10px 24px 22px' }}>
              <SearchBar />
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════
            STATS BAR
        ══════════════════════════════════════════ */}
        <section style={{ padding: '64px 0' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 24 }} className="sm:!grid-cols-4">
              {['years','satisfaction','locations','support'].map((key, i) => (
                <motion.div key={key} {...inView(i * 0.08)} style={{ textAlign: 'center' }}>
                  <p className="lux-serif" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 700, color: brand, lineHeight: 1.1 }}>
                    {t(`home.stats.${key}.value`)}
                  </p>
                  <p style={{ fontSize: 13, color: ink3, marginTop: 6, fontWeight: 500, letterSpacing: '0.05em' }}>
                    {t(`home.stats.${key}.label`)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            OUR HOTELS / LOCATIONS
        ══════════════════════════════════════════ */}
        <section style={{ background: '#fff', borderTop: `1px solid ${bdColor}`, borderBottom: `1px solid ${bdColor}`, padding: '72px 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }} className="sm:!px-8 lg:!px-14">
            <motion.div {...inView(0)} style={{ marginBottom: 52 }}>
              <span className="brand-pill" style={{ marginBottom: 16, display: 'inline-flex' }}>
                {t('home.locations.badge')}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <h2 className="lux-serif section-h" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: 10 }}>
                    {t('home.locations.title')}
                  </h2>
                  <div className="section-line" style={{ marginBottom: 14 }} />
                  <p style={{ color: ink3, maxWidth: 400, lineHeight: 1.7 }}>
                    {t('home.locations.subtitle')}
                  </p>
                </div>
                <Link to="/hotels" className="btn-outline" style={{ padding: '10px 20px', fontSize: 13 }}>
                  {t('home.locations.cta')} <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: 20 }} className="md:!grid-cols-3">
              {LOCATION_IMAGES.map(({ key, img, rooms }, i) => (
                <motion.div
                  key={key} {...inView(i * 0.1)} className="loc-card"
                  style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', aspectRatio: '3/4', boxShadow: '0 4px 24px rgba(0,0,0,0.09)', cursor: 'pointer' }}
                >
                  <img src={img} alt={t(`home.locations.items.${key}.name`)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: brand, marginBottom: 6 }}>
                      {t(`home.locations.items.${key}.tagline`)}
                    </p>
                    <h3 className="lux-serif" style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 8 }}>
                      {t(`home.locations.items.${key}.name`)}
                    </h3>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 16, maxWidth: 240 }}>
                      {t(`home.locations.items.${key}.desc`)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                        {rooms} {t('home.locations.roomsLabel')}
                      </span>
                      <Link to="/hotels" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: brand, textDecoration: 'none' }}>
                        {t('home.locations.explore')} <ArrowRight style={{ width: 13, height: 13 }} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FEATURED SUITES (API)
        ══════════════════════════════════════════ */}
        <section style={{ background: surface, padding: '72px 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }} className="sm:!px-8 lg:!px-14">
            <motion.div {...inView(0)} style={{ marginBottom: 52 }}>
              <span className="brand-pill" style={{ marginBottom: 16, display: 'inline-flex' }}>
                {t('home.featured.badge')}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <h2 className="lux-serif section-h" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: 10 }}>
                    {t('home.featured.title')}
                  </h2>
                  <div className="section-line" style={{ marginBottom: 14 }} />
                  <p style={{ color: ink3, lineHeight: 1.7 }}>{t('home.featured.subtitle')}</p>
                </div>
                <Link to="/hotels" className="btn-outline" style={{ padding: '10px 20px', fontSize: 13 }}>
                  {t('home.featured.cta')} <ChevronRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </motion.div>

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <LoadingSpinner size="xl" />
              </div>
            ) : hotels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 24, border: `1px solid ${bdColor}` }}>
                <p style={{ color: ink3, marginBottom: 20 }}>{t('home.featured.emptyTitle')}</p>
                <Link to="/auth/register" className="btn-primary" style={{ padding: '13px 28px', fontSize: 14 }}>
                  {t('home.featured.emptyCta')} <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: 20 }} className="md:!grid-cols-2 lg:!grid-cols-3">
                {hotels.slice(0, 6).map((hotel, i) => (
                  <HotelCard key={hotel._id} hotel={hotel} index={i} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            EXPERIENCES — dark
        ══════════════════════════════════════════ */}
        <section style={{ background: '#0f0f0f', padding: '72px 0', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }} className="sm:!px-8 lg:!px-14">
            <motion.div {...inView(0)} style={{ textAlign: 'center', marginBottom: 52 }}>
              <span style={{
                display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                color: brand, background: 'rgba(246,160,3,0.1)', border: '1px solid rgba(246,160,3,0.28)',
                borderRadius: 100, padding: '5px 16px', marginBottom: 16,
              }}>
                {t('home.experiences.badge')}
              </span>
              <h2 className="lux-serif section-h" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 14 }}>
                {t('home.experiences.title')}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.40)', maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
                {t('home.experiences.subtitle')}
              </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }} className="lg:!grid-cols-4">
              {EXPERIENCE_DATA.map(({ key, icon: Icon, img }, i) => (
                <motion.div key={key} {...inView(i * 0.1)} className="exp-card"
                  style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', aspectRatio: '3/4', cursor: 'pointer' }}
                >
                  <img src={img} alt={t(`home.experiences.items.${key}.title`)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.08) 60%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px 20px' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(246,160,3,0.18)', border: '1px solid rgba(246,160,3,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Icon style={{ width: 15, height: 15, color: brand }} />
                    </div>
                    <h3 className="lux-serif" style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', marginBottom: 4 }}>
                      {t(`home.experiences.items.${key}.title`)}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12, lineHeight: 1.6 }}>
                      {t(`home.experiences.items.${key}.desc`)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            WHY CHOOSE US
        ══════════════════════════════════════════ */}
        <section style={{ background: '#fff', borderTop: `1px solid ${bdColor}`, borderBottom: `1px solid ${bdColor}`, padding: '72px 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }} className="sm:!px-8 lg:!px-14">
            <motion.div {...inView(0)} style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="brand-pill" style={{ marginBottom: 16, display: 'inline-flex' }}>
                {t('home.features.badge')}
              </span>
              <h2 className="lux-serif section-h" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: 12 }}>
                {t('home.features.title')}
              </h2>
              <div className="section-line" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: ink3, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
                {t('home.features.subtitle')}
              </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: 16 }} className="sm:!grid-cols-2 lg:!grid-cols-3">
              {FEATURE_KEYS.map((key, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <motion.div key={key} {...inView(i * 0.07)} className="feat-card"
                    style={{ display: 'flex', gap: 16, borderRadius: 18, padding: '20px 22px', background: surface, border: `1.5px solid ${bdColor}` }}
                  >
                    <div className="feat-ico" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 12, background: brandLight, border: `1.5px solid ${brandBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .25s, border-color .25s' }}>
                      <Icon style={{ width: 20, height: 20, color: brandDark, transition: 'color .25s' }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, color: ink, marginBottom: 4 }}>
                        {t(`home.features.items.${key}.title`)}
                      </h3>
                      <p style={{ fontSize: 13.5, color: ink3, lineHeight: 1.65 }}>
                        {t(`home.features.items.${key}.desc`)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════ */}
        <section style={{ background: surface, padding: '72px 0' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }} className="sm:!px-8 lg:!px-14">
            <motion.div {...inView(0)} style={{ textAlign: 'center', marginBottom: 52 }}>
              <span className="brand-pill" style={{ marginBottom: 16, display: 'inline-flex' }}>
                {t('home.testimonials.badge')}
              </span>
              <h2 className="lux-serif section-h" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: 12 }}>
                {t('home.testimonials.title')}
              </h2>
              <div className="section-line" style={{ margin: '0 auto' }} />
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1,1fr)', gap: 20 }} className="md:!grid-cols-3">
              {TESTIMONIAL_DATA.map(({ key, avatar, rating }, i) => (
                <motion.div key={key} {...inView(i * 0.1)} className="testi-card"
                  style={{ display: 'flex', flexDirection: 'column', borderRadius: 24, padding: '26px 28px', background: '#fff', border: `1.5px solid ${bdColor}` }}
                >
                  <Quote style={{ width: 28, height: 28, color: brandBorder, marginBottom: 14, flexShrink: 0 }} />
                  <p style={{ flex: 1, fontStyle: 'italic', color: ink2, fontSize: 14.5, lineHeight: 1.75, marginBottom: 18 }}>
                    "{t(`home.testimonials.items.${key}.text`)}"
                  </p>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} style={{ width: 13, height: 13, color: brand, fill: brand }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={avatar} alt={t(`home.testimonials.items.${key}.name`)} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 13.5, color: ink }}>
                        {t(`home.testimonials.items.${key}.name`)}
                      </p>
                      <p style={{ fontSize: 12, color: ink3 }}>
                        {t(`home.testimonials.items.${key}.location`)} · {t(`home.testimonials.items.${key}.branch`)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            CTA — BOOK YOUR STAY
        ══════════════════════════════════════════ */}
        <section style={{ padding: '0 16px 80px' }} className="sm:!px-6 lg:!px-8">
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <motion.div {...inView(0)} style={{
              position: 'relative', overflow: 'hidden', borderRadius: 28,
              background: 'linear-gradient(140deg, #0e0700 0%, #2b1400 50%, #0e0700 100%)',
            }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.14, backgroundImage: 'url(https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1400&q=60)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(246,160,3,0.16) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', padding: '72px 24px', textAlign: 'center' }} className="sm:!px-16 sm:!py-24">
                <motion.span {...inView(0.05)} style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: brand, background: 'rgba(246,160,3,0.1)', border: '1px solid rgba(246,160,3,0.28)', borderRadius: 100, padding: '5px 16px', marginBottom: 20 }}>
                  {t('home.cta.badge')}
                </motion.span>

                <motion.h2 {...inView(0.1)} className="lux-serif section-h"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 18 }}
                >
                  {t('home.cta.titleLine1')}<br />
                  <span style={{ color: brand }}>{t('home.cta.titleLine2')}</span>
                </motion.h2>

                <motion.p {...inView(0.15)} style={{ color: 'rgba(255,255,255,0.48)', maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.8, fontSize: '1.05rem' }}>
                  {t('home.cta.subtitle')}
                </motion.p>

                <motion.div {...inView(0.2)} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
                  <Link to="/hotels" className="btn-primary" style={{ padding: '14px 36px', fontSize: 15 }}>
                    {t('home.cta.primary')} <ArrowRight style={{ width: 18, height: 18 }} />
                  </Link>
                  <Link to="/hotels" className="btn-ghost" style={{ padding: '14px 36px', fontSize: 15 }}>
                    {t('home.cta.secondary')}
                  </Link>
                </motion.div>

                {/* Trust pills */}
                <motion.div {...inView(0.25)} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                  {['freeCancellation','bestPrice','instantConfirmation'].map(key => (
                    <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.48)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 100, padding: '5px 14px' }}>
                      <CheckCircle style={{ width: 11, height: 11, color: brand }} />
                      {t(`home.cta.pills.${key}`)}
                    </span>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </>
  );
}