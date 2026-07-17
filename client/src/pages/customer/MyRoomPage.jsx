import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BedDouble, Sparkles, Wrench, Moon, Coffee, ShoppingBag,
  CheckCircle2, Clock, AlertCircle, RefreshCw,
  Phone, Star, LogOut, X, Plus, Minus, ChevronRight,
  Wifi, MapPin, Calendar, User, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUser } from '@/features/auth/authSlice';
import { bookingApi } from '@/services/bookingApi';
import { roomRequestApi } from '@/services/roomRequestApi';
import { formatDate } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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

const REQUEST_TYPES = [
  { type: 'cleaning',         icon: Sparkles,    labelKey: 'myRoom.cleaning',      descKey: 'myRoom.cleaningDesc' },
  { type: 'extra_towels',     icon: ShoppingBag, labelKey: 'myRoom.extraTowels',   descKey: 'myRoom.extraTowelsDesc' },
  { type: 'extra_pillows',    icon: BedDouble,   labelKey: 'myRoom.extraPillows',  descKey: 'myRoom.extraPillowsDesc' },
  { type: 'maintenance',      icon: Wrench,      labelKey: 'myRoom.maintenance',   descKey: 'myRoom.maintenanceDesc' },
  { type: 'do_not_disturb',   icon: Moon,        labelKey: 'myRoom.doNotDisturb',  descKey: 'myRoom.doNotDisturbDesc' },
  { type: 'room_service',     icon: Coffee,      labelKey: 'myRoom.roomService',   descKey: 'myRoom.roomServiceDesc' },
  { type: 'checkout_request', icon: LogOut,      labelKey: 'myRoom.earlyCheckout', descKey: 'myRoom.earlyCheckoutDesc' },
  { type: 'other',            icon: Phone,       labelKey: 'myRoom.otherRequest',  descKey: 'myRoom.otherRequestDesc' },
];

const STATUS_CONFIG = {
  pending:      { labelKey: 'myRoom.pending',      bg: G.goldBg,   text: '#92400e', dot: G.gold, icon: Clock },
  acknowledged: { labelKey: 'myRoom.acknowledged', bg: '#eff6ff',  text: '#1d4ed8', dot: '#3b82f6', icon: CheckCircle2 },
  in_progress:  { labelKey: 'myRoom.inProgress',   bg: '#f5f3ff',  text: '#6d28d9', dot: '#8b5cf6', icon: RefreshCw },
  completed:    { labelKey: 'myRoom.done',         bg: '#f0fdf4',  text: '#15803d', dot: '#22c55e', icon: CheckCircle2 },
  cancelled:    { labelKey: 'myRoom.cancelled',    bg: '#f5f5f5',  text: '#737373', dot: '#d4d4d4', icon: X },
};

const ROOM_SERVICE_ITEMS = [
  { name: 'Breakfast Tray',    price: 25, emoji: '🍳' },
  { name: 'Coffee / Tea',      price: 8,  emoji: '☕' },
  { name: 'Bottled Water ×2',  price: 5,  emoji: '💧' },
  { name: 'Fruit Platter',     price: 20, emoji: '🍇' },
  { name: 'Club Sandwich',     price: 18, emoji: '🥪' },
  { name: 'Mineral Water',     price: 4,  emoji: '🫗' },
];

/* ─────────────────────────────────────────
   Request Modal
───────────────────────────────────────── */
const RequestModal = ({ type, label, onClose, onSubmit, isRtl }) => {
  const { t } = useTranslation();
  const [desc,   setDesc]   = useState('');
  const [items,  setItems]  = useState([]);
  const [saving, setSaving] = useState(false);
  const isService = type === 'room_service';

  const adjust = (item, delta) => {
    setItems(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (!existing && delta > 0) return [...prev, { ...item, quantity: 1 }];
      return prev
        .map(i => i.name === item.name ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0);
    });
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const canSubmit = !saving && (isService ? items.length > 0 || desc.trim() : true);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(type, desc, isService ? items : []);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const cfg = REQUEST_TYPES.find(r => r.type === type);
  const Icon = cfg?.icon || Phone;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }}
    dir={isRtl ? 'rtl' : 'ltr'}
    className="sm:!items-center sm:!p-4">
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 48 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        style={{
          background: '#fff', width: '100%', maxWidth: 448,
          borderRadius: isRtl ? '24px 24px 0 0' : '24px 24px 0 0',
          boxShadow: '0 20px 80px rgba(0,0,0,0.15)', overflow: 'hidden',
        }}
        className="sm:!rounded-3xl">

        {/* Header */}
        <div style={{
          paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 16,
          borderBottom: `1px solid ${G.border}`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 16,
                background: G.goldBg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 20, height: 20, color: G.gold }} />
              </div>
              <div>
                <h2 style={{ fontWeight: 700, color: G.ink, margin: 0, fontSize: 16 }}>
                  {label}
                </h2>
                <p style={{ fontSize: 12, color: G.ink3, marginTop: 2 }}>
                  {cfg?.descKey && t(cfg.descKey)}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 12, background: G.surface,
                border: 'none', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: G.ink3, transition: 'background .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e5e5e5'}
              onMouseLeave={e => e.currentTarget.style.background = G.surface}>
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{
          padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
          maxHeight: '70vh', overflowY: 'auto',
        }}>

          {/* Room service items */}
          {isService && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: G.ink3,
                textTransform: 'uppercase', letterSpacing: '.08em', margin: 0,
              }}>
                {t('myRoom.menu')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ROOM_SERVICE_ITEMS.map(item => {
                  const added = items.find(i => i.name === item.name);
                  return (
                    <div key={item.name}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 0', borderRadius: 16, transition: 'background .2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = G.surface}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20 }}>{item.emoji}</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: G.ink2, margin: 0 }}>
                            {item.name}
                          </p>
                          <p style={{ fontSize: 12, fontWeight: 700, color: G.gold, margin: '2px 0 0 0' }}>
                            ${item.price}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {added ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: G.surface, borderRadius: 12, paddingLeft: 8, paddingRight: 8,
                          }}>
                            <button onClick={() => adjust(item, -1)}
                              style={{
                                width: 24, height: 24, borderRadius: 8, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: G.ink3, transition: 'color .2s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                              onMouseLeave={e => e.currentTarget.style.color = G.ink3}>
                              <Minus style={{ width: 12, height: 12 }} />
                            </button>
                            <span style={{ fontSize: 13, fontWeight: 700, color: G.ink, width: 20, textAlign: 'center' }}>
                              {added.quantity}
                            </span>
                            <button onClick={() => adjust(item, 1)}
                              style={{
                                width: 24, height: 24, borderRadius: 8, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                background: G.gold, border: 'none', cursor: 'pointer',
                                color: '#fff', transition: 'opacity .2s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                              <Plus style={{ width: 12, height: 12 }} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => adjust(item, 1)}
                            style={{
                              fontSize: 12, fontWeight: 700, paddingLeft: 12, paddingRight: 12,
                              paddingTop: 6, paddingBottom: 6, borderRadius: 12,
                              border: `2px solid ${G.gold}`, color: G.gold,
                              background: 'transparent', cursor: 'pointer',
                              transition: 'all .2s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = G.gold;
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = G.gold;
                            }}>
                            {t('myRoom.add')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {total > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                    borderRadius: 16, background: G.goldBg,
                  }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: G.ink2 }}>
                    {t('myRoom.orderTotal')}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: G.gold }}>
                    ${total}
                  </span>
                </motion.div>
              )}
            </div>
          )}

          {/* Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{
              fontSize: 11, fontWeight: 700, color: G.ink3,
              textTransform: 'uppercase', letterSpacing: '.08em', margin: 0,
            }}>
              {t('myRoom.notes')}
            </label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder={t('myRoom.notesPlaceholder')}
              rows={3}
              style={{
                width: '100%', paddingLeft: 16, paddingRight: 16,
                paddingTop: 12, paddingBottom: 12, borderRadius: 16,
                border: `1.5px solid ${G.border}`, background: G.surface,
                fontSize: 13, color: G.ink, resize: 'none', outline: 'none',
                fontFamily: 'inherit', transition: 'border-color .2s, box-shadow .2s',
              }}
              onFocus={e => {
                e.target.style.borderColor = G.gold;
                e.target.style.boxShadow = `0 0 0 3px ${G.gold}20`;
              }}
              onBlur={e => {
                e.target.style.borderColor = G.border;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: '100%', paddingTop: 14, paddingBottom: 14, borderRadius: 16,
              border: 'none', fontWeight: 700, color: '#fff', fontSize: 13,
              background: canSubmit ? G.gold : '#d4d4d4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'opacity .2s, transform .1s', opacity: canSubmit ? 1 : 0.6,
            }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.opacity = '1'; }}
            onMouseDown={e => { if (canSubmit) e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={e => { if (canSubmit) e.currentTarget.style.transform = 'scale(1)'; }}>
            {saving
              ? <div style={{
                  width: 16, height: 16, borderLeft: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin .7s linear infinite',
                }} />
              : <>
                  <Send style={{ width: 16, height: 16 }} />
                  {t('myRoom.sendRequest')}
                </>
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Status Badge
───────────────────────────────────────── */
const StatusBadge = ({ status, t }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
      borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: cfg.bg, color: cfg.text,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
        background: cfg.dot,
      }} />
      {t(cfg.labelKey)}
    </span>
  );
};

/* ─────────────────────────────────────────
   Request Card
───────────────────────────────────────── */
const RequestCard = ({ req, t }) => {
  const cfg  = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const rt   = REQUEST_TYPES.find(r => r.type === req.type);
  const RIcon = rt?.icon || Phone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: 16,
        background: '#fff', borderRadius: 16, border: `1.5px solid ${G.border}`,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)', transition: 'box-shadow .2s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)'}>
      <div style={{
        width: 40, height: 40, borderRadius: 16, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        background: G.goldBg,
      }}>
        <RIcon style={{ width: 20, height: 20, color: G.gold }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: G.ink, margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {rt?.labelKey ? t(rt.labelKey) : req.title}
        </p>
        {req.description && (
          <p style={{
            fontSize: 12, color: G.ink3, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2, margin: 0,
          }}>
            {req.description}
          </p>
        )}
        <p style={{ fontSize: 11, color: '#ccc', marginTop: 4, margin: '4px 0 0 0' }}>
          {formatDate(req.createdAt, 'h:mm a')}
        </p>
      </div>
      <StatusBadge status={req.status} t={t} />
    </motion.div>
  );
};

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function MyRoomPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const user     = useSelector(selectUser);
  const [booking,  setBooking]  = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await bookingApi.getMyBookings({ status: 'checked_in', limit: 1 });
      const active = (data.data || [])[0];
      if (active) {
        setBooking(active);
        const rRes = await roomRequestApi.getMyRequests(active._id);
        setRequests(rRes.data.data.requests || []);
      }
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (type, description, items) => {
    if (!booking) { toast.error(t('myRoom.noStayError')); return; }
    try {
      const { data } = await roomRequestApi.create({
        bookingId: booking._id, type, description, items,
      });
      setRequests(p => [data.data.request, ...p]);
      toast.success(t('myRoom.requestSent'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('myRoom.failedRequest'));
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          width: 48, height: 48, border: `2px solid ${G.border}`,
          borderTopColor: G.gold, borderRadius: '50%',
          margin: '0 auto', animation: 'spin .8s linear infinite',
        }} />
        <p style={{ fontSize: 13, color: G.ink3 }}>{t('myRoom.loadingRoom')}</p>
      </div>
    </div>
  );

  /* ── No active stay ── */
  if (!booking) return (
    <div style={{
      minHeight: '100vh', background: G.surface,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      paddingLeft: 16, paddingRight: 16,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 24, display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          background: G.goldBg,
        }}>
          <BedDouble style={{ width: 48, height: 48, color: G.gold }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: G.ink, margin: 0 }}>
          {t('myRoom.noActiveStay')}
        </h2>
        <p style={{
          fontSize: 13, color: G.ink3, lineHeight: 1.6, marginTop: 8, margin: '8px 0 0 0',
        }}>
          {t('myRoom.noActiveStayDesc')}
        </p>
      </motion.div>
    </div>
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }} dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Hero Banner ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: G.gold,
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -48, [isRtl ? 'left' : 'right']: -48,
          width: 192, height: 192, borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)', opacity: 0.2,
        }} />
        <div style={{
          position: 'absolute', bottom: -32, [isRtl ? 'right' : 'left']: -32,
          width: 128, height: 128, borderRadius: '50%',
          background: 'rgba(255,255,255,0.3)', opacity: 0.1,
        }} />

        <div style={{
          position: 'relative', maxWidth: 800, margin: '0 auto',
          paddingLeft: 20, paddingRight: 20, paddingTop: 40, paddingBottom: 40,
        }}>
          {/* Checked in badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.2)', borderRadius: 20,
            paddingLeft: 14, paddingRight: 14, paddingTop: 6, paddingBottom: 6,
            marginBottom: 16,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#fff',
              animation: 'pulse .2s infinite',
            }} />
            <span style={{
              color: '#fff', fontSize: 11, fontWeight: 700,
              letterSpacing: '.08em', textTransform: 'uppercase',
            }}>
              {t('myRoom.checkedIn')}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700,
            color: '#fff', margin: '0 0 4px 0',
            fontFamily: 'Playfair Display, serif',
          }}>
            {booking.roomId?.name || t('myRoom.yourRoom')}
          </h1>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 0, margin: '0 0 20px 0',
          }}>
            {booking.hotelId?.name}
          </p>

          {/* Stay info pills */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
          }}>
            {[
              { icon: Calendar, label: t('myRoom.checkout'), value: formatDate(booking.checkOut, 'EEE, MMM d') },
              { icon: Moon, label: t('myRoom.nights'), value: t('myRoom.nightsCount', { count: booking.nights || 1 }) },
              { icon: User, label: t('myRoom.guests'), value: t('myRoom.adultsCount', { count: booking.adults || 1 }) },
            ].map(({ icon: Icon, label, value }, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)', borderRadius: 12,
                paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
              }}>
                <Icon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.8)' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{
        maxWidth: 800, margin: '0 auto', paddingLeft: 16, paddingRight: 16,
        paddingTop: 24, paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* Pending alert */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
                borderRadius: 16, border: `1.5px solid ${G.goldRing}`,
                background: G.goldBg,
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: 12,
                background: G.gold, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Clock style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <p style={{
                fontSize: 13, fontWeight: 600, color: '#92400e', margin: 0,
              }}>
                {t('myRoom.pendingAlert', { count: pendingCount })}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Request Grid */}
        <div style={{
          background: '#fff', borderRadius: 24, border: `1.5px solid ${G.border}`,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          <div style={{
            paddingLeft: 20, paddingRight: 20, paddingTop: 20, paddingBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{ fontWeight: 700, color: G.ink, margin: 0, fontSize: 16 }}>
                {t('myRoom.howCanWeHelp')}
              </h2>
              <p style={{ fontSize: 12, color: G.ink3, marginTop: 4, margin: '4px 0 0 0' }}>
                {t('myRoom.tapService')}
              </p>
            </div>
            <button
              onClick={() => load(true)}
              style={{
                width: 32, height: 32, borderRadius: 12, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: G.ink3, background: 'none', border: 'none', cursor: 'pointer',
                transition: 'all .2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = G.surface;
                e.currentTarget.style.color = G.ink;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = G.ink3;
              }}>
              <RefreshCw style={{
                width: 16, height: 16,
                animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
              }} />
            </button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 8, padding: 12,
          }}>
            {REQUEST_TYPES.map(({ type, icon: Icon, labelKey, descKey }, idx) => (
              <motion.button
                key={type}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => setModal({ type, label: t(labelKey) })}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16,
                  borderRadius: 16, background: G.surface, border: '1px solid transparent',
                  cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = G.border;
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = G.surface;
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 16, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: G.goldBg, transition: 'transform .2s',
                }}>
                  <Icon style={{ width: 20, height: 20, color: G.gold }} />
                </div>
                <div>
                  <p style={{
                    fontSize: 12, fontWeight: 700, color: G.ink2, margin: 0,
                    lineHeight: 1.2,
                  }}>
                    {t(labelKey)}
                  </p>
                  <p style={{
                    fontSize: 10, color: G.ink3, marginTop: 4, margin: '4px 0 0 0',
                    display: 'none',
                  }}
                  className="sm:!block">
                    {t(descKey)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Requests history */}
        {requests.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingLeft: 4, paddingRight: 4,
            }}>
              <h2 style={{ fontWeight: 700, color: G.ink, margin: 0, fontSize: 16 }}>
                {t('myRoom.yourRequests')}
              </h2>
              <span style={{
                fontSize: 12, fontWeight: 600, paddingLeft: 10, paddingRight: 10,
                paddingTop: 4, paddingBottom: 4, borderRadius: 20,
                background: G.goldBg, color: G.gold,
              }}>
                {t('myRoom.totalCount', { count: requests.length })}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requests.map((req, i) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <RequestCard req={req} t={t} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Contact card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, paddingLeft: 20, paddingRight: 20,
          paddingTop: 20, paddingBottom: 20, borderRadius: 24,
          border: `1.5px solid ${G.goldRing}`, background: G.goldBg,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: G.gold,
          }}>
            <Phone style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 13, fontWeight: 700, color: '#92400e', margin: 0,
            }}>
              {t('myRoom.needHelp')}
            </p>
            <p style={{
              fontSize: 12, marginTop: 4, margin: '4px 0 0 0', color: G.goldText,
            }}>
              {t('myRoom.needHelpDesc')}
            </p>
          </div>
          <ChevronRight style={{ width: 16, height: 16, flexShrink: 0, color: G.gold }} />
        </div>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modal && (
          <RequestModal
            type={modal.type}
            label={modal.label}
            onClose={() => setModal(null)}
            onSubmit={handleSubmit}
            isRtl={isRtl}
          />
        )}
      </AnimatePresence>
    </div>
  );
}