import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatCurrency, formatRating } from '@/utils/formatters';

/* ── Brand tokens ── */
const G = {
  gold:     '#f6a003',
  goldDark: '#d98902',
  goldBg:   '#fff8ed',
  surface:  '#faf8f5',
  border:   '#f0ece4',
  ink:      '#2a2218',
  ink2:     '#4a3f30',
  ink3:     '#9a8e7e',
  ink4:     '#b0a898',
};

const StarIcon = ({ size=11, color=G.gold }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ArrowIcon = ({ flip }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
       style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={G.gold}
       strokeWidth="2.2" style={{ flexShrink:0 }}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

export const HotelCard = ({ hotel, index = 0 }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay:index*0.07, duration:0.4, ease:[.22,1,.36,1] }}
      style={{ background:'#fff', borderRadius:20, border:`1.5px solid ${G.border}`,
               overflow:'hidden', transition:'box-shadow .25s, border-color .25s, transform .25s' }}
      whileHover={{ y:-4, boxShadow:'0 16px 48px rgba(0,0,0,.10)' }}
    >
      {/* Image */}
      <Link to={'/hotels/'+hotel._id} style={{ textDecoration:'none', display:'block' }}>
        <div style={{ position:'relative', height:200, background:G.surface, overflow:'hidden' }}>
          {hotel.coverImage ? (
            <motion.img src={'/api/v1/media/'+hotel.coverImage} alt={hotel.name}
              whileHover={{ scale:1.06 }} transition={{ duration:.6 }}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
                          justifyContent:'center',
                          background:'linear-gradient(135deg, #fdf6e8 0%, #f5ead0 100%)' }}>
              <span style={{ fontSize:52, color:'#e8d5a8', fontFamily:'Georgia, serif',
                             userSelect:'none' }}>
                {hotel.name?.[0]}
              </span>
            </div>
          )}

          {/* Gradient */}
          <div style={{ position:'absolute', inset:0, pointerEvents:'none',
                        background:'linear-gradient(to top, rgba(0,0,0,.32) 0%, transparent 55%)' }} />

          {/* Star rating — top left (or right in RTL) */}
          {hotel.starRating > 0 && (
            <div style={{ position:'absolute', top:12, [isRtl ? 'right' : 'left']:12,
                          display:'flex', alignItems:'center', gap:3,
                          background:'rgba(0,0,0,.42)', backdropFilter:'blur(6px)',
                          borderRadius:20, padding:'4px 10px' }}>
              {Array.from({ length:hotel.starRating }).map((_,i) => <StarIcon key={i} />)}
            </div>
          )}

          {/* Avg rating — bottom right (or left in RTL) */}
          {hotel.avgRating > 0 && (
            <div style={{ position:'absolute', bottom:12, [isRtl ? 'left' : 'right']:12,
                          display:'flex', alignItems:'center', gap:4, background:G.gold,
                          borderRadius:20, padding:'4px 10px', boxShadow:`0 2px 8px ${G.gold}60` }}>
              <StarIcon color="#fff" />
              <span style={{ fontSize:12, fontWeight:700, color:'#fff', lineHeight:1 }}>
                {formatRating(hotel.avgRating)}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div style={{ padding:'16px 18px 18px' }} dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Name + reviews */}
        <div style={{ marginBottom:8 }}>
          <Link to={'/hotels/'+hotel._id} style={{ textDecoration:'none' }}>
            <h3 style={{ fontSize:15, fontWeight:700, color:G.ink, lineHeight:1.35,
                         margin:0, transition:'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color=G.gold}
              onMouseLeave={e => e.currentTarget.style.color=G.ink}>
              {hotel.name}
            </h3>
          </Link>
          {hotel.totalReviews > 0 && (
            <p style={{ fontSize:11, color:G.ink4, margin:'3px 0 0', lineHeight:1 }}>
              {hotel.totalReviews}{' '}
              {hotel.totalReviews === 1 ? t('hotels.review') : t('hotels.reviews')}
            </p>
          )}
        </div>

        {/* Location */}
        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:14 }}>
          <PinIcon />
          <span style={{ fontSize:12, color:G.ink3, overflow:'hidden',
                         textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {hotel.location || [hotel.address?.city, hotel.address?.country].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Price + CTA */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      paddingTop:13, borderTop:`1px solid ${G.border}`, flexWrap:'wrap', gap:8 }}>
          <div style={{ lineHeight:1 }}>
            <span style={{ display:'block', fontSize:10, color:G.ink4, marginBottom:3,
                           textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 }}>
              {t('hotels.startingFrom')}
            </span>
            <span style={{ fontSize:20, fontWeight:800, color:G.gold, letterSpacing:'-.01em' }}>
              {formatCurrency(hotel.minPrice || 99)}
            </span>
            <span style={{ fontSize:11, color:G.ink4,
                           [isRtl ? 'marginRight' : 'marginLeft']:3 }}>
              /{t('common.night')}
            </span>
          </div>

          <Link to={'/hotels/'+hotel._id}
            style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'9px 16px',
                     background:G.gold, color:'#fff', borderRadius:11,
                     fontSize:12, fontWeight:700, textDecoration:'none',
                     transition:'background .15s, transform .1s, box-shadow .15s',
                     letterSpacing:'.01em', whiteSpace:'nowrap',
                     boxShadow:`0 2px 10px ${G.gold}40` }}
            onMouseEnter={e => { e.currentTarget.style.background=G.goldDark;
                                 e.currentTarget.style.boxShadow=`0 4px 16px ${G.gold}50`; }}
            onMouseLeave={e => { e.currentTarget.style.background=G.gold;
                                 e.currentTarget.style.boxShadow=`0 2px 10px ${G.gold}40`; }}
            onMouseDown={e  => { e.currentTarget.style.transform='scale(.96)'; }}
            onMouseUp={e    => { e.currentTarget.style.transform='scale(1)'; }}>
            {t('hotels.viewRooms')}
            <ArrowIcon flip={isRtl} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};