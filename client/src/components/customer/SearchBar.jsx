import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { DateRangePicker } from './DateRangePicker';

/* ── Brand tokens ── */
const G = {
  gold:     '#f6a003',
  goldDark: '#d98902',
  goldBg:   '#fff8ed',
  goldRing: '#fde68a',
  goldText: '#b45309',
  surface:  '#fafaf9',
  border:   '#ede8df',
  ink:      '#2a2218',
  ink2:     '#4a3f30',
  ink3:     '#9a8e7e',
};

export const SearchBar = ({ compact = false, initialValues = {} }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    city:     initialValues.city     || '',
    checkIn:  initialValues.checkIn  ? new Date(initialValues.checkIn)  : undefined,
    checkOut: initialValues.checkOut ? new Date(initialValues.checkOut) : undefined,
    adults:   initialValues.adults   || 1,
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleDateChange = ({ checkIn, checkOut }) =>
    setForm(p => ({ ...p, checkIn, checkOut }));

  const handleSearch = (e) => {
    e.preventDefault();
    const today    = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const params = new URLSearchParams({
      city:     form.city,
      checkIn:  form.checkIn  ? form.checkIn.toISOString().split('T')[0]  : today,
      checkOut: form.checkOut ? form.checkOut.toISOString().split('T')[0] : tomorrow,
      adults:   form.adults,
    });
    navigate('/hotels?' + params.toString());
  };

  /* ── Shared styles ── */
  const iconStyle = {
    position: 'absolute',
    [isRtl ? 'right' : 'left']: 12,
    top: '50%', transform: 'translateY(-50%)',
    color: G.gold, pointerEvents: 'none', zIndex: 1,
  };

  const inputBase = {
    width: '100%',
    paddingLeft: isRtl ? 12 : 36,
    paddingRight: isRtl ? 36 : 12,
    borderRadius: 12,
    border: `1.5px solid ${G.border}`,
    background: '#fff', color: G.ink,
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color .2s, box-shadow .2s',
    textAlign: isRtl ? 'right' : 'left',
    boxSizing: 'border-box',
  };

  const focusOn  = (e) => {
    e.target.style.borderColor = G.gold;
    e.target.style.boxShadow = `0 0 0 3px ${G.gold}20`;
  };
  const focusOff = (e) => {
    e.target.style.borderColor = G.border;
    e.target.style.boxShadow = 'none';
  };

  const submitBtn = {
    background: G.gold, color: '#fff',
    border: 'none', borderRadius: 12,
    fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    whiteSpace: 'nowrap', flexShrink: 0,
    transition: 'background .2s, transform .1s',
    boxShadow: `0 2px 12px ${G.gold}40`,
    fontSize: 13,
  };

  const btnHover  = (e) => { e.currentTarget.style.background = G.goldDark; };
  const btnLeave  = (e) => { e.currentTarget.style.background = G.gold; };
  const btnDown   = (e) => { e.currentTarget.style.transform = 'scale(0.97)'; };
  const btnUp     = (e) => { e.currentTarget.style.transform = 'scale(1)'; };

  /* ── COMPACT ── */
  if (compact) return (
    <form
      onSubmit={handleSearch}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap',
        background: '#fff', border: `1.5px solid ${G.border}`,
        borderRadius: 16, paddingLeft: 7, paddingRight: 7, paddingTop: 7, paddingBottom: 7,
        boxShadow: `0 2px 16px ${G.gold}12`,
      }}>

      {/* City */}
      <div style={{
        position: 'relative', flex: '1 1 140px', minWidth: 120,
      }}>
        <MapPin size={14} style={iconStyle} />
        <input
          value={form.city}
          onChange={e => set('city', e.target.value)}
          placeholder={t('search.destination')}
          style={{ ...inputBase, paddingTop: 8, paddingBottom: 8, border: 'none', boxShadow: 'none', background: 'transparent' }}
        />
      </div>

      <div style={{
        width: 1, height: 26, background: G.border, flexShrink: 0,
      }} className="hidden sm:block" />

      {/* Date range */}
      <div style={{ flex: '2 1 240px', minWidth: 200 }}>
        <DateRangePicker
          checkIn={form.checkIn}
          checkOut={form.checkOut}
          onChange={handleDateChange}
        />
      </div>

      <div style={{
        width: 1, height: 26, background: G.border, flexShrink: 0,
      }} className="hidden sm:block" />

      {/* Adults */}
      <div style={{
        position: 'relative', flex: '0 1 80px', minWidth: 70,
      }}>
        <Users size={14} style={iconStyle} />
        <input
          type="number" min="1" max="20"
          value={form.adults}
          onChange={e => set('adults', e.target.value)}
          style={{ ...inputBase, paddingTop: 8, paddingBottom: 8, border: 'none', boxShadow: 'none', background: 'transparent' }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        style={{ ...submitBtn, padding: '8px 16px', flex: '0 0 auto' }}
        onMouseEnter={btnHover} onMouseLeave={btnLeave}
        onMouseDown={btnDown} onMouseUp={btnUp}>
        <Search size={14} />
        <span className="hidden sm:inline">{t('search.search')}</span>
      </button>
    </form>
  );

  /* ── FULL ── */
  return (
    <motion.form
      onSubmit={handleSearch}
      dir={isRtl ? 'rtl' : 'ltr'}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: '#fff', borderRadius: 20,
        border: `1.5px solid ${G.border}`,
        boxShadow: `0 4px 32px ${G.gold}18`,
        padding: 16,
      }}>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 10, alignItems: 'center',
      }}>

        {/* City */}
        <div style={{
          position: 'relative', gridColumn: 'span 1',
        }}>
          <MapPin size={14} style={iconStyle} />
          <input
            value={form.city}
            onChange={e => set('city', e.target.value)}
            placeholder={t('search.whereTo')}
            style={{ ...inputBase, paddingTop: 11, paddingBottom: 11 }}
            onFocus={focusOn} onBlur={focusOff}
          />
        </div>

        {/* Date range — span 2 cols on wider screens */}
        <div style={{ gridColumn: 'span 2' }}>
          <DateRangePicker
            checkIn={form.checkIn}
            checkOut={form.checkOut}
            onChange={handleDateChange}
          />
        </div>

        {/* Adults */}
        <div style={{ position: 'relative' }}>
          <Users size={14} style={iconStyle} />
          <input
            type="number" min="1" max="20"
            value={form.adults}
            onChange={e => set('adults', e.target.value)}
            style={{ ...inputBase, paddingTop: 11, paddingBottom: 11 }}
            onFocus={focusOn} onBlur={focusOff}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          style={{ ...submitBtn, padding: '11px 0', fontSize: 14, width: '100%' }}
          onMouseEnter={btnHover} onMouseLeave={btnLeave}
          onMouseDown={btnDown} onMouseUp={btnUp}>
          <Search size={15} />
          {t('search.search')}
        </button>
      </div>
    </motion.form>
  );
};