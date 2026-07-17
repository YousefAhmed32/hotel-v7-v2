import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BedDouble, Users, Edit, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';

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

/* ── Type badge styles — no amber ── */
const TYPE_STYLES = {
  standard:   { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe' },
  deluxe:     { bg:'#faf5ff', text:'#7e22ce', border:'#e9d5ff' },
  suite:      { bg:G.goldBg,  text:G.goldText, border:G.goldRing },
  penthouse:  { bg:'#fff1f2', text:'#be123c', border:'#fecdd3' },
  villa:      { bg:'#f0fdf4', text:'#15803d', border:'#bbf7d0' },
  studio:     { bg:'#f0f9ff', text:'#0369a1', border:'#bae6fd' },
  connecting: { bg:'#eef2ff', text:'#3730a3', border:'#c7d2fe' },
  accessible: { bg:'#f0fdfa', text:'#0f766e', border:'#99f6e4' },
};

/* ── Image Strip ── */
const ImageStrip = ({ room }) => {
  const images = room.images?.length ? room.images : room.coverImage ? [room.coverImage] : [];
  const [idx, setIdx] = useState(0);

  if (images.length === 0) return (
    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
                  justifyContent:'center', background:G.surface }}>
      <BedDouble style={{ width:40, height:40, color:G.border }} />
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden group">
      <AnimatePresence mode="sync">
        <motion.img key={idx}
          src={`/api/v1/media/${images[idx]}`} alt={room.name}
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          transition={{ duration:0.3 }}
          className="absolute inset-0 w-full h-full object-cover" />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i-1+images.length)%images.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                       flex items-center justify-center opacity-0 group-hover:opacity-100
                       transition-all shadow-sm"
            style={{ background:'rgba(255,255,255,0.92)', color:G.ink2, border:'none', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background='#fff'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.92)'}>
            <ChevronLeft style={{ width:15, height:15 }} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i+1)%images.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
                       flex items-center justify-center opacity-0 group-hover:opacity-100
                       transition-all shadow-sm"
            style={{ background:'rgba(255,255,255,0.92)', color:G.ink2, border:'none', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background='#fff'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.92)'}>
            <ChevronRight style={{ width:15, height:15 }} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_,i) => (
              <span key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                style={{ display:'block', borderRadius:20, cursor:'pointer', transition:'all .2s',
                         width: i===idx ? 16 : 6, height:6,
                         background: i===idx ? G.gold : 'rgba(255,255,255,0.6)' }} />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
               style={{ background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:10, fontWeight:600,
                        padding:'3px 8px', borderRadius:20 }}>
            {idx+1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════
   RoomCard
════════════════════════════════════════════ */
export const RoomCard = ({ room, onEdit, onDelete }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const typeStyle = TYPE_STYLES[room.type] || TYPE_STYLES.standard;

  /* Translate room type key — falls back to raw value */
  const typeLabel = (() => {
    const key = `rooms.${room.type}`;
    const val = t(key);
    return val === key ? room.type : val;
  })();

  return (
    <motion.div layout
      initial={{ opacity:0, scale:0.97, y:8 }}
      animate={{ opacity:1, scale:1,    y:0 }}
      transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
      style={{ background:'#fff', borderRadius:20, border:`1.5px solid ${G.border}`,
               overflow:'hidden', transition:'box-shadow .25s, border-color .25s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.09)';
                           e.currentTarget.style.borderColor=G.goldRing; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow='none';
                           e.currentTarget.style.borderColor=G.border; }}>

      {/* Image */}
      <div style={{ height:192, position:'relative', overflow:'hidden', background:G.surface }}>
        <ImageStrip room={room} />

        {/* Type badge */}
        <div style={{ position:'absolute', top:12, [isRtl ? 'right' : 'left']:12 }}>
          <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                         textTransform:'capitalize',
                         background:typeStyle.bg, color:typeStyle.text,
                         border:`1px solid ${typeStyle.border}` }}>
            {typeLabel}
          </span>
        </div>

        {/* AI pricing badge */}
        {room.aiSuggestedPrice && room.aiSuggestedPrice !== room.basePrice && (
          <div style={{ position:'absolute', top:12, [isRtl ? 'left' : 'right']:12,
                        display:'flex', alignItems:'center', gap:4, padding:'4px 8px',
                        borderRadius:20, background:G.gold, color:'#fff',
                        fontSize:10, fontWeight:700, boxShadow:`0 2px 8px ${G.gold}50` }}>
            <Sparkles style={{ width:10, height:10 }} />
            {t('rooms.aiPriced')}
          </div>
        )}

        {/* Inactive overlay */}
        {!room.isActive && (
          <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.75)',
                        backdropFilter:'blur(2px)', display:'flex', alignItems:'center',
                        justifyContent:'center' }}>
            <span style={{ background:'#f5f5f5', color:G.ink3, fontSize:12, fontWeight:600,
                           padding:'6px 14px', borderRadius:20, border:`1px solid ${G.border}` }}>
              {t('common.inactive')}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:16 }} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Name + actions */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                      marginBottom:8 }}>
          <div style={{ minWidth:0, flex:1 }}>
            <h3 style={{ fontWeight:700, color:G.ink, fontSize:14, margin:0,
                         overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {room.name}
            </h3>
            {room.roomNumber && (
              <p style={{ fontSize:11, color:G.ink3, marginTop:2 }}>
                # {room.roomNumber}
              </p>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0,
                        [isRtl ? 'marginRight' : 'marginLeft']:8 }}>
            <button onClick={() => onEdit(room)}
              style={{ padding:6, borderRadius:8, border:'none', background:'transparent',
                       color:G.ink3, cursor:'pointer', transition:'background .15s, color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background=G.goldBg; e.currentTarget.style.color=G.goldText; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=G.ink3; }}>
              <Edit style={{ width:15, height:15 }} />
            </button>
            <button onClick={() => onDelete(room._id)}
              style={{ padding:6, borderRadius:8, border:'none', background:'transparent',
                       color:G.ink3, cursor:'pointer', transition:'background .15s, color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#fef2f2'; e.currentTarget.style.color='#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=G.ink3; }}>
              <Trash2 style={{ width:15, height:15 }} />
            </button>
          </div>
        </div>

        {/* Specs */}
        <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12,
                      color:G.ink3, marginBottom:10 }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Users style={{ width:13, height:13 }} />
            {room.maxAdults} {t('common.adults')}
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}>
            <BedDouble style={{ width:13, height:13 }} />
            {room.beds?.[0]?.type || t('rooms.bed')}
          </span>
          {room.sizeM2 && <span>{room.sizeM2} m²</span>}
        </div>

        {/* Amenities */}
        {room.amenities?.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:12 }}>
            {room.amenities.slice(0,4).map(a => (
              <span key={a} style={{ padding:'2px 8px', borderRadius:8, background:G.surface,
                                     color:G.ink3, fontSize:11, textTransform:'capitalize',
                                     border:`1px solid ${G.border}` }}>
                {a}
              </span>
            ))}
            {room.amenities.length > 4 && (
              <span style={{ fontSize:11, color:G.ink3, alignSelf:'center' }}>
                +{room.amenities.length-4}
              </span>
            )}
          </div>
        )}

        {/* Price row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      paddingTop:12, borderTop:`1px solid ${G.border}` }}>
          <div>
            <p style={{ fontSize:19, fontWeight:800, color:G.gold, letterSpacing:'-0.01em', margin:0 }}>
              {formatCurrency(room.basePrice)}
            </p>
            <p style={{ fontSize:11, color:G.ink3, margin:0 }}>{t('common.perNight')}</p>
          </div>

          {/* AI suggestion */}
          {room.aiSuggestedPrice && room.aiSuggestedPrice !== room.basePrice && (
            <div style={{ textAlign: isRtl ? 'left' : 'right', padding:'6px 10px',
                          borderRadius:10, background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
              <p style={{ fontSize:10, color:G.ink3, margin:0 }}>{t('rooms.aiPriced')}</p>
              <p style={{ fontSize:14, fontWeight:700, color:'#15803d', margin:0 }}>
                {formatCurrency(room.aiSuggestedPrice)}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};