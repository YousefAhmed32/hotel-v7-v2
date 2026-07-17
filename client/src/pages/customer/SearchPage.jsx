import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import {
  fetchHotels, selectHotels, selectHotelPagination, selectHotelsLoading,
} from '@/features/hotel/hotelSlice';
import { SearchBar } from '@/components/customer/SearchBar';
import { HotelCard } from '@/components/customer/HotelCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/* ── Brand tokens ── */
const G = {
  gold:     '#f6a003',
  goldDark: '#d98902',
  goldBg:   '#fff8ed',
  goldRing: '#fde68a',
  goldText: '#b45309',
  surface:  '#faf8f5',
  white:    '#ffffff',
  border:   '#f0ece4',
  ink:      '#2a2218',
  ink2:     '#4a3f30',
  ink3:     '#8a8070',
  ink4:     '#b0a898',
};

const Divider = () => (
  <div style={{ height:1, background:G.border, margin:'14px 0' }} />
);

const SectionLabel = ({ children }) => (
  <p style={{ fontSize:10, fontWeight:700, color:G.ink4, textTransform:'uppercase',
              letterSpacing:'.1em', marginBottom:8, margin:'0 0 8px' }}>
    {children}
  </p>
);

/* ── Filter option button ── */
const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick}
    style={{ width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:10, border:'none',
             background: active ? G.goldBg : 'transparent',
             color:      active ? G.goldText : G.ink2,
             fontWeight: active ? 700 : 400,
             fontSize:13, cursor:'pointer', marginBottom:2, transition:'background .15s, color .15s',
             display:'flex', alignItems:'center', gap:6 }}
    onMouseEnter={e => { if(!active) e.currentTarget.style.background='#fdf8f0'; }}
    onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent'; }}>
    {active && <span style={{ color:G.gold, fontSize:10 }}>✓</span>}
    {children}
  </button>
);

/* ── Guest chip ── */
const GuestChip = ({ label, active, onClick }) => (
  <button onClick={onClick}
    style={{ padding:'5px 12px', borderRadius:8, fontSize:12,
             border:`1.5px solid ${active ? G.gold : G.border}`,
             background: active ? G.gold  : G.white,
             color:      active ? '#fff'  : G.ink2,
             fontWeight: active ? 700 : 400,
             cursor:'pointer', transition:'all .15s' }}
    onMouseEnter={e => { if(!active) e.currentTarget.style.borderColor=G.gold; }}
    onMouseLeave={e => { if(!active) e.currentTarget.style.borderColor=G.border; }}>
    {label}
  </button>
);

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function SearchPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const SORT_OPTIONS = [
    { value:'avgRating-desc',  label:t('hotels.topRated')     },
    { value:'basePrice-asc',   label:t('hotels.priceLowHigh') },
    { value:'basePrice-desc',  label:t('hotels.priceHighLow') },
    { value:'createdAt-desc',  label:t('hotels.newest')       },
  ];
  const RATING_OPTIONS = [
    { value:'',    label:t('hotels.anyRating') },
    { value:'3',   label:'3+ ★' },
    { value:'4',   label:'4+ ★' },
    { value:'4.5', label:'4.5+ ★' },
    { value:'5',   label:'5 ★' },
  ];

  const dispatch        = useDispatch();
  const [searchParams]  = useSearchParams();
  const hotels          = useSelector(selectHotels);
  const pagination      = useSelector(selectHotelPagination);
  const isLoading       = useSelector(selectHotelsLoading);

  const [page,        setPage]        = useState(1);
  const [minRating,   setMinRating]   = useState('');
  const [adults,      setAdults]      = useState('');
  const [sortBy,      setSortBy]      = useState('avgRating-desc');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const city     = searchParams.get('city')    || '';
  const checkIn  = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut')|| '';
  const search   = searchParams.get('search')  || '';
  const hasFilters = minRating || adults || sortBy !== 'avgRating-desc';

  const load = useCallback(() => {
    const [sb, so] = sortBy.split('-');
    dispatch(fetchHotels({
      page, limit:9,
      city:      city      || undefined,
      search:    search    || undefined,
      minRating: minRating || undefined,
      adults:    adults    || undefined,
      sortBy:sb, sortOrder:so,
    }));
  }, [dispatch, page, city, search, minRating, adults, sortBy]);

  useEffect(() => { load(); }, [load]);

  const clearFilters = () => { setMinRating(''); setAdults(''); setSortBy('avgRating-desc'); setPage(1); };

  /* Filters panel — reused in sidebar and drawer */
  const FiltersContent = () => (
    <div style={{ display:'flex', flexDirection:'column' }}>
      <SectionLabel>{t('filters.rating')}</SectionLabel>
      {RATING_OPTIONS.map(({ value, label }) => (
        <FilterBtn key={value} active={minRating===value}
          onClick={() => { setMinRating(value); setPage(1); }}>
          {label}
        </FilterBtn>
      ))}
      <Divider />
      <SectionLabel>{t('filters.guests')}</SectionLabel>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:4 }}>
        {[
          { label:t('common.any'), value:'' },
          { label:'1', value:'1' }, { label:'2', value:'2' },
          { label:'3', value:'3' }, { label:'4', value:'4' },
          { label:'5+', value:'5' },
        ].map(({ label, value }) => (
          <GuestChip key={value} label={label} active={adults===value}
            onClick={() => { setAdults(value); setPage(1); }} />
        ))}
      </div>
      <Divider />
      <SectionLabel>{t('filters.sort')}</SectionLabel>
      {SORT_OPTIONS.map(({ value, label }) => (
        <FilterBtn key={value} active={sortBy===value}
          onClick={() => { setSortBy(value); setPage(1); }}>
          {label}
        </FilterBtn>
      ))}
    </div>
  );

  const paginationPages = pagination
    ? Array.from({ length:Math.min(5, pagination.totalPages) }, (_,i) =>
        Math.max(1, Math.min(page-2, pagination.totalPages-4)) + i)
    : [];

  return (
    <div style={{ minHeight:'100vh', background:G.surface }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Sticky search strip */}
      <div style={{ background:G.white, borderBottom:`1.5px solid ${G.border}`, padding:'12px 0',
                    position:'sticky', top:64, zIndex:30, boxShadow:'0 2px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>
          <SearchBar compact initialValues={{ city, checkIn, checkOut }} />
        </div>
      </div>

      {/* Main layout */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px 64px' }}>
        <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block"
            style={{ width:230, flexShrink:0, background:G.white, border:`1.5px solid ${G.border}`,
                     borderRadius:18, padding:20, position:'sticky', top:136,
                     boxShadow:'0 2px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:G.ink,
                             display:'flex', alignItems:'center', gap:6 }}>
                <SlidersHorizontal size={14} color={G.gold} />
                {t('filters.title')}
              </span>
              {hasFilters && (
                <button onClick={clearFilters}
                  style={{ fontSize:11, color:'#e05555', background:'none', border:'none',
                           cursor:'pointer', padding:0, fontWeight:600 }}
                  onMouseEnter={e => e.currentTarget.style.color='#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color='#e05555'}>
                  {t('common.clearAll')}
                </button>
              )}
            </div>
            <Divider />
            <FiltersContent />
          </aside>

          {/* Results */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* Top bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                          marginBottom:20, flexWrap:'wrap', gap:10 }}>
              <p style={{ fontSize:13, color:G.ink3 }}>
                {isLoading
                  ? t('common.searching')
                  : <>{pagination?.total || 0} {t('hotels.title')}</>}
              </p>
              <div style={{ display:'flex', gap:8 }} className="lg:hidden">
                <button onClick={() => setFiltersOpen(true)}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
                           borderRadius:10, border:`1.5px solid ${G.border}`, background:G.white,
                           fontSize:13, color:G.ink2, cursor:'pointer', position:'relative' }}>
                  <SlidersHorizontal size={14} color={G.gold} />
                  {t('filters.title')}
                  {hasFilters && (
                    <span style={{ width:7, height:7, borderRadius:'50%',
                                   background:G.gold, display:'inline-block' }} />
                  )}
                </button>
                <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
                  style={{ padding:'8px 12px', borderRadius:10, border:`1.5px solid ${G.border}`,
                           background:G.white, fontSize:13, color:G.ink2, cursor:'pointer', outline:'none' }}>
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
                <LoadingSpinner size="xl" />
              </div>
            ) : hotels.length === 0 ? (
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                style={{ background:G.white, borderRadius:20, border:`1.5px solid ${G.border}`,
                         padding:'80px 24px', textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:20, background:G.goldBg,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              margin:'0 auto 16px' }}>
                  <Search size={28} color={G.gold} />
                </div>
                <p style={{ fontWeight:700, color:G.ink, fontSize:16, marginBottom:6 }}>
                  {t('hotels.noHotels')}
                </p>
                <p style={{ fontSize:13, color:G.ink3, marginBottom: hasFilters ? 20 : 0 }}>
                  {t('hotels.tryDifferentFilters')}
                </p>
                {hasFilters && (
                  <button onClick={clearFilters}
                    style={{ padding:'10px 28px', background:G.gold, color:'#fff', border:'none',
                             borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer',
                             boxShadow:`0 4px 16px ${G.gold}40` }}
                    onMouseEnter={e => e.currentTarget.style.background=G.goldDark}
                    onMouseLeave={e => e.currentTarget.style.background=G.gold}>
                    {t('common.clearFilters')}
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div layout style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:18 }}>
                <AnimatePresence>
                  {hotels.map((hotel, i) => <HotelCard key={hotel._id} hotel={hotel} index={i} />)}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                            gap:6, marginTop:36 }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={!pagination.hasPrev}
                  style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${G.border}`,
                           background:G.white, fontSize:13, color:G.ink2, cursor:'pointer',
                           opacity: !pagination.hasPrev ? .35 : 1, transition:'border-color .15s' }}
                  onMouseEnter={e => { if(pagination.hasPrev) e.currentTarget.style.borderColor=G.gold; }}
                  onMouseLeave={e => e.currentTarget.style.borderColor=G.border}>
                  {isRtl ? '→' : '←'} {t('common.previous')}
                </button>

                {paginationPages.map(pg => {
                  const active = pg === page;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      style={{ width:38, height:38, borderRadius:10, fontSize:13,
                               fontWeight: active ? 700 : 400,
                               border:`1.5px solid ${active ? G.gold : G.border}`,
                               background: active ? G.gold : G.white,
                               color:      active ? '#fff' : G.ink2,
                               cursor:'pointer', transition:'all .15s', display:'flex',
                               alignItems:'center', justifyContent:'center',
                               boxShadow: active ? `0 2px 10px ${G.gold}40` : 'none' }}>
                      {pg}
                    </button>
                  );
                })}

                <button onClick={() => setPage(p => p+1)} disabled={!pagination.hasNext}
                  style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${G.border}`,
                           background:G.white, fontSize:13, color:G.ink2, cursor:'pointer',
                           opacity: !pagination.hasNext ? .35 : 1, transition:'border-color .15s' }}
                  onMouseEnter={e => { if(pagination.hasNext) e.currentTarget.style.borderColor=G.gold; }}
                  onMouseLeave={e => e.currentTarget.style.borderColor=G.border}>
                  {t('common.next')} {isRtl ? '←' : '→'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <div style={{ position:'fixed', inset:0, zIndex:50 }} className="lg:hidden">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setFiltersOpen(false)}
              style={{ position:'absolute', inset:0, background:'rgba(30,20,10,.45)', backdropFilter:'blur(4px)' }} />
            <motion.div
              initial={{ x: isRtl ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '-100%' : '100%' }}
              transition={{ type:'spring', damping:28, stiffness:280 }}
              style={{ position:'absolute', [isRtl ? 'left' : 'right']:0,
                       top:0, bottom:0, width:300, background:G.white,
                       overflowY:'auto', boxShadow: isRtl ? '4px 0 32px rgba(0,0,0,.1)' : '-4px 0 32px rgba(0,0,0,.1)' }}>

              {/* Drawer header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                            padding:'18px 20px', borderBottom:`1.5px solid ${G.border}`,
                            position:'sticky', top:0, background:G.white, zIndex:1 }}
                   dir={isRtl ? 'rtl' : 'ltr'}>
                <h2 style={{ fontSize:15, fontWeight:700, color:G.ink, margin:0 }}>{t('filters.title')}</h2>
                <button onClick={() => setFiltersOpen(false)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                  <X size={18} color={G.ink3} />
                </button>
              </div>

              {/* Drawer body */}
              <div style={{ padding:20 }} dir={isRtl ? 'rtl' : 'ltr'}>
                <FiltersContent />
              </div>

              {/* Drawer footer */}
              <div style={{ padding:'14px 20px', borderTop:`1.5px solid ${G.border}`, display:'flex', gap:10,
                            position:'sticky', bottom:0, background:G.white }}>
                {hasFilters && (
                  <button onClick={() => { clearFilters(); setFiltersOpen(false); }}
                    style={{ flex:1, padding:'11px 0', borderRadius:12, border:`1.5px solid ${G.border}`,
                             background:G.white, fontSize:13, fontWeight:600, color:G.ink2, cursor:'pointer' }}>
                    {t('common.clear')}
                  </button>
                )}
                <button onClick={() => setFiltersOpen(false)}
                  style={{ flex:1, padding:'11px 0', borderRadius:12, border:'none',
                           background:G.gold, fontSize:13, fontWeight:700, color:'#fff', cursor:'pointer',
                           boxShadow:`0 3px 12px ${G.gold}40` }}>
                  {t('common.apply')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}