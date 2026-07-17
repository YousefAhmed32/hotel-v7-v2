// npm install react-day-picker
// react-day-picker v9+

import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isValid } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import 'react-day-picker/style.css';

/* ── Brand tokens ── */
const G = {
  gold:     '#f6a003',
  goldDark: '#d98902',
  goldBg:   '#fff8ed',
  goldRing: '#fde68a',
  goldText: '#b45309',
  surface:  '#fafaf9',
  border:   '#e8e5e0',
  borderAlt: '#ede8df',
  ink:      '#2a2218',
  ink2:     '#6b6b6b',
  ink3:     '#b0a898',
  ink4:     '#d0c8bc',
};

export function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  placeholder = { from: 'Check-in', to: 'Check-out' },
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [open,  setOpen]  = useState(false);
  const [month, setMonth] = useState(new Date());
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const range = { from: checkIn || undefined, to: checkOut || undefined };

  const handleSelect = (selected) => {
    onChange({
      checkIn:  selected?.from || undefined,
      checkOut: selected?.to   || undefined,
    });
    if (selected?.from && selected?.to && selected.from !== selected.to) {
      setTimeout(() => setOpen(false), 220);
    }
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange({ checkIn: undefined, checkOut: undefined });
  };

  const fmt = (d) => (d && isValid(d) ? format(d, 'MMM d, yyyy') : null);

  const triggerStyle = (filled) => ({
    flex: 1,
    display: 'flex', alignItems: 'center', gap: 8,
    paddingLeft: isRtl ? 12 : 10,
    paddingRight: isRtl ? 10 : 12,
    paddingTop: 10, paddingBottom: 10,
    borderRadius: 12,
    border: `1.5px solid ${open ? G.gold : filled ? G.gold : G.borderAlt}`,
    background: filled ? '#fffbf2' : '#fff',
    cursor: 'pointer',
    transition: 'border-color .2s, background .2s',
    minWidth: 0,
    textAlign: isRtl ? 'right' : 'left',
  });

  return (
    <div ref={ref} style={{
      position: 'relative', display: 'flex', gap: 6,
      flex: 1, minWidth: 0,
    }}
    dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Check-in trigger */}
      <button type="button" onClick={() => setOpen(v => !v)} style={triggerStyle(!!checkIn)}>
        <Calendar size={14} color={G.gold} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, textAlign: isRtl ? 'right' : 'left', overflow: 'hidden' }}>
          <p style={{
            fontSize: 9, color: G.ink3, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.06em',
            lineHeight: 1, marginBottom: 3, margin: '0 0 3px 0',
          }}>
            {t('datePicker.checkIn')}
          </p>
          <p style={{
            fontSize: 12, fontWeight: checkIn ? 600 : 400, color: checkIn ? G.ink : G.ink3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
          }}>
            {fmt(checkIn) || placeholder.from}
          </p>
        </div>
      </button>

      <div style={{
        display: 'flex', alignItems: 'center', color: G.ink4,
        fontSize: 12, flexShrink: 0, userSelect: 'none',
      }}>
        {isRtl ? '←' : '→'}
      </div>

      {/* Check-out trigger */}
      <button type="button" onClick={() => setOpen(v => !v)} style={triggerStyle(!!checkOut)}>
        <Calendar size={14} color={G.gold} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, textAlign: isRtl ? 'right' : 'left', flex: 1, overflow: 'hidden' }}>
          <p style={{
            fontSize: 9, color: G.ink3, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.06em',
            lineHeight: 1, marginBottom: 3, margin: '0 0 3px 0',
          }}>
            {t('datePicker.checkOut')}
          </p>
          <p style={{
            fontSize: 12, fontWeight: checkOut ? 600 : 400, color: checkOut ? G.ink : G.ink3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0,
          }}>
            {fmt(checkOut) || placeholder.to}
          </p>
        </div>
        {(checkIn || checkOut) && (
          <span
            onClick={clear}
            style={{
              marginLeft: isRtl ? 0 : 'auto',
              marginRight: isRtl ? 'auto' : 0,
              flexShrink: 0,
              width: 18, height: 18, borderRadius: '50%',
              background: '#f0ece4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = G.goldBg}
            onMouseLeave={e => e.currentTarget.style.background = '#f0ece4'}>
            <X size={10} color={G.ink3} />
          </span>
        )}
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 'auto',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#fff',
            border: `1.5px solid ${G.border}`,
            borderRadius: 20,
            boxShadow: `0 16px 48px rgba(0,0,0,0.14), 0 4px 16px ${G.gold}14`,
            paddingLeft: 16, paddingRight: 16, paddingTop: 20, paddingBottom: 14,
            animation: 'rdpFadeIn .18s ease',
            width: '95vw',
            maxWidth: 680,
          }}
          ref={(el) => {
            if (!el) return;
            const parent = ref.current;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            el.style.top  = `${rect.bottom + 10}px`;
            el.style.left = `${rect.left + rect.width / 2}px`;
          }}
          dir={isRtl ? 'rtl' : 'ltr'}>

          {checkIn && checkOut && (
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: G.goldBg, color: G.goldText,
                border: `1px solid ${G.goldRing}`,
                borderRadius: 20, paddingLeft: 12, paddingRight: 12,
                paddingTop: 3, paddingBottom: 3, fontSize: 11, fontWeight: 700,
              }}>
                {t('datePicker.nightsSelected', {
                  count: Math.round((checkOut - checkIn) / 86400000),
                })}
              </span>
            </div>
          )}

          <style>{`
            .rdp-root {
              --rdp-accent-color: ${G.gold};
              --rdp-accent-background-color: ${G.goldBg};
              --rdp-day-width: 36px;
              --rdp-day-height: 36px;
              --rdp-day_button-width: 34px;
              --rdp-day_button-height: 34px;
              --rdp-selected-border: 2px solid ${G.gold};
              font-family: inherit;
              width: 100%;
            }
            .rdp-months {
              gap: 16px;
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
            }
            .rdp-month { flex: 1; min-width: 260px; }
            .rdp-button_previous, .rdp-button_next {
              background: #fff; border: 1.5px solid ${G.borderAlt} !important;
              border-radius: 8px !important; width: 28px; height: 28px;
              display: flex; align-items: center; justify-content: center;
              transition: border-color .15s, background .15s; color: ${G.ink2};
            }
            .rdp-button_previous:hover, .rdp-button_next:hover {
              border-color: ${G.gold} !important;
              background: ${G.goldBg} !important;
              color: ${G.gold};
            }
            .rdp-month_caption { margin-bottom: 10px; }
            .rdp-caption_label {
              font-size: 13px !important;
              font-weight: 700 !important;
              color: ${G.ink} !important;
            }
            .rdp-weekday {
              font-size: 10px !important;
              font-weight: 700 !important;
              color: ${G.ink3} !important;
              text-transform: uppercase;
              letter-spacing: .06em;
            }
            .rdp-day_button {
              border-radius: 8px !important;
              font-size: 12px !important;
              font-weight: 500 !important;
              color: ${G.ink} !important;
              transition: background .12s, color .12s !important;
            }
            .rdp-day_button:hover {
              background: ${G.goldBg} !important;
              color: ${G.goldText} !important;
            }
            .rdp-day--range_start .rdp-day_button,
            .rdp-day--range_end   .rdp-day_button {
              background: ${G.gold} !important;
              color: #fff !important;
              font-weight: 700 !important;
              box-shadow: 0 2px 10px ${G.gold}59 !important;
            }
            .rdp-day--range_middle .rdp-day_button {
              background: ${G.goldBg} !important;
              color: ${G.goldText} !important;
              border-radius: 0 !important;
            }
            .rdp-day--range_start .rdp-day_button {
              border-radius: ${isRtl ? '0 8px 8px 0' : '8px 0 0 8px'} !important;
            }
            .rdp-day--range_end .rdp-day_button {
              border-radius: ${isRtl ? '8px 0 0 8px' : '0 8px 8px 0'} !important;
            }
            .rdp-day--today .rdp-day_button {
              border: 1.5px solid ${G.gold} !important;
              color: ${G.goldText} !important;
              font-weight: 700 !important;
            }
            .rdp-day--disabled .rdp-day_button {
              color: ${G.ink4} !important;
              text-decoration: line-through;
            }
            @keyframes rdpFadeIn {
              from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            @media (max-width: 520px) {
              .rdp-months { flex-direction: column; }
              .rdp-month  { min-width: unset; width: 100%; }
            }
          `}</style>

          <DayPicker
            mode="range"
            numberOfMonths={2}
            selected={range}
            onSelect={handleSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={{ before: new Date() }}
            showOutsideDays={false}
            components={{
              Chevron: ({ orientation }) =>
                orientation === (isRtl ? 'right' : 'left')
                  ? <ChevronLeft size={12} />
                  : <ChevronRight size={12} />,
            }}
          />

          <div style={{
            borderTop: `1px solid ${G.border}`,
            paddingTop: 10, marginTop: 4,
            display: 'flex', alignItems: 'center',
            justifyContent: isRtl ? 'flex-end' : 'flex-start',
            flexWrap: 'wrap', gap: 8,
          }}>
            <p style={{
              fontSize: 11, color: G.ink3, margin: 0,
              flex: isRtl ? 'unset' : 1,
            }}>
              {!checkIn && t('datePicker.selectCheckIn')}
              {checkIn && !checkOut && t('datePicker.selectCheckOut')}
              {checkIn && checkOut && (
                <span>
                  <span style={{ color: G.gold, fontWeight: 700 }}>{fmt(checkIn)}</span>
                  {' → '}
                  <span style={{ color: G.gold, fontWeight: 700 }}>{fmt(checkOut)}</span>
                </span>
              )}
            </p>
            <div style={{
              display: 'flex', gap: 6,
              marginLeft: isRtl ? 'auto' : 0,
            }}>
              {(checkIn || checkOut) && (
                <button type="button" onClick={clear} style={{
                  paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6,
                  borderRadius: 8, border: `1.5px solid ${G.borderAlt}`, background: '#fff',
                  fontSize: 11, fontWeight: 600, color: G.ink2, cursor: 'pointer',
                  transition: 'all .2s',
                }}>
                  {t('datePicker.clear')}
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} style={{
                paddingLeft: 16, paddingRight: 16, paddingTop: 6, paddingBottom: 6,
                borderRadius: 8, border: 'none', background: G.gold,
                fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
                boxShadow: `0 2px 8px ${G.gold}4d`,
                transition: 'opacity .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {t('datePicker.done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}