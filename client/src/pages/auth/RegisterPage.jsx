import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Hotel, User, Mail, Lock, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PWD_RULES = [
  { id: 'len',    labelKey: 'auth.pwd.length',  test: v => v.length >= 8            },
  { id: 'upper',  labelKey: 'auth.pwd.upper',   test: v => /[A-Z]/.test(v)         },
  { id: 'num',    labelKey: 'auth.pwd.number',  test: v => /\d/.test(v)            },
  { id: 'special',labelKey: 'auth.pwd.special', test: v => /[^A-Za-z0-9]/.test(v) },
];

const getStrength = (pwd) => PWD_RULES.filter(r => r.test(pwd)).length;

const STRENGTH_META = [
  { labelKey: '',                color: 'rgba(255,255,255,0.1)'   },
  { labelKey: 'auth.pwd.weak',   color: '#ef4444'    },
  { labelKey: 'auth.pwd.fair',   color: '#f97316' },
  { labelKey: 'auth.pwd.good',   color: '#eab308' },
  { labelKey: 'auth.pwd.strong', color: '#f6a003'  },
];

const G = { gold: '#f6a003', goldDark: '#d4880a' };

const InputField = ({ icon: Icon, label, right, isRtl, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-white/60 tracking-wide" style={{ textAlign: isRtl ? 'right' : 'left' }}>{label}</label>
    <div className="relative group">
      <Icon className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[#f6a003] transition-colors duration-200 z-10 pointer-events-none"
        style={{ [isRtl ? 'right' : 'left']: 14 }} />
      <input
        {...props}
        className="w-full py-3 rounded-xl text-sm text-white font-medium bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-[#f6a003]/60 focus:ring-2 focus:ring-[#f6a003]/15 placeholder:text-white/20 outline-none transition-all duration-200"
        style={{
          paddingLeft: isRtl ? 16 : 40,
          paddingRight: isRtl ? (right ? 44 : 16) : 16,
          textAlign: isRtl ? 'right' : 'left',
        }}
      />
      {right && <div className="absolute top-1/2 -translate-y-1/2 z-10" style={{ [isRtl ? 'left' : 'right']: 12 }}>{right}</div>}
    </div>
  </div>
);

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { register, isLoading, error } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState(false);

  const strength = getStrength(form.password);
  const meta = STRENGTH_META[strength];

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'password' && !touched) setTouched(true);
  };
  const handleSubmit = async (e) => { e.preventDefault(); await register(form); };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row" style={{ background: '#0d0d1a' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* LEFT — FORM */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 py-10 relative overflow-hidden order-2 lg:order-1">

        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #f6a003 0%, transparent 70%)', filter: 'blur(50px)' }} />
        <div className="pointer-events-none absolute -bottom-40 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f6a003 0%, transparent 70%)', filter: 'blur(55px)' }} />

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.022] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="relative w-full max-w-[420px]">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${G.gold} 0%, #c8830a 100%)`, boxShadow: `0 8px 24px ${G.gold}73` }}>
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>LuxStay</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('auth.createAccount')}
            </h1>
            <p className="text-white/40 text-sm font-medium">{t('auth.startJourney')}</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-6 sm:p-8 space-y-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 font-medium overflow-hidden" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">

              <InputField icon={User} label={t('auth.fullName')} type="text" name="name" value={form.name} onChange={handleChange} required placeholder={t('auth.namePlaceholder')} autoComplete="name" isRtl={isRtl} />

              <InputField icon={Mail} label={t('auth.emailAddress')} type="email" name="email" value={form.email} onChange={handleChange} required placeholder={t('auth.emailPlaceholder')} autoComplete="email" isRtl={isRtl} />

              {/* Password with strength meter */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-white/60 tracking-wide" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  {t('auth.password')}
                </label>
                <div className="relative group">
                  <Lock className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-[#f6a003] transition-colors duration-200 z-10 pointer-events-none"
                    style={{ [isRtl ? 'right' : 'left']: 14 }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    placeholder={t('auth.pwdPlaceholder')}
                    autoComplete="new-password"
                    className="w-full py-3 rounded-xl text-sm text-white font-medium bg-white/[0.06] border border-white/10 hover:border-white/20 focus:border-[#f6a003]/60 focus:ring-2 focus:ring-[#f6a003]/15 placeholder:text-white/20 outline-none transition-all duration-200"
                    style={{
                      paddingLeft: isRtl ? 16 : 40,
                      paddingRight: isRtl ? 44 : 44,
                      textAlign: isRtl ? 'right' : 'left',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute top-1/2 -translate-y-1/2 z-10 text-white/25 hover:text-[#f6a003] transition-colors"
                    style={{ [isRtl ? 'left' : 'right']: 12 }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                <AnimatePresence>
                  {touched && form.password.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-2 space-y-2">
                      {/* Bar segments */}
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full overflow-hidden bg-white/[0.07]">
                            <motion.div className="h-full rounded-full" style={{ background: i <= strength ? meta.color : '' }}
                              initial={{ width: 0 }} animate={{ width: i <= strength ? '100%' : '0%' }} transition={{ duration: 0.25 }} />
                          </div>
                        ))}
                        {meta.labelKey && (
                          <span className="text-[11px] font-semibold ml-1 w-12 text-right" style={{ color: strength === 4 ? G.gold : 'rgba(255,255,255,0.45)' }}>
                            {t(meta.labelKey)}
                          </span>
                        )}
                      </div>

                      {/* Rules checklist */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {PWD_RULES.map(rule => {
                          const ok = rule.test(form.password);
                          return (
                            <div key={rule.id} className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200" style={{ background: ok ? G.gold : 'rgba(255,255,255,0.1)' }}>
                                {ok ? <Check className="w-2 h-2 text-white" strokeWidth={3} /> : <X className="w-2 h-2 text-white/30" strokeWidth={3} />}
                              </div>
                              <span className={`text-[10px] font-medium transition-colors duration-200 ${ok ? 'text-white/60' : 'text-white/25'}`}>
                                {t(rule.labelKey)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || strength < 2}
                className="w-full py-3 rounded-xl text-sm font-bold text-white tracking-wide transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] mt-2"
                style={{
                  background: `linear-gradient(135deg, ${G.gold} 0%, ${G.goldDark} 100%)`,
                  boxShadow: `0 4px 20px ${G.gold}66`,
                }}
                onMouseOver={e => { if (!isLoading && strength >= 2) e.currentTarget.style.boxShadow = `0 6px 28px ${G.gold}8c`; }}
                onMouseOut={e => e.currentTarget.style.boxShadow = `0 4px 20px ${G.gold}66`}>
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('auth.createAccount')}
              </button>
            </form>

            {/* Terms note */}
            <p className="text-center text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {t('auth.agreeTerms')}{' '}
              <span className="underline cursor-pointer" style={{ color: 'rgba(246,160,3,0.6)' }}>{t('auth.termsOfService')}</span>
              {' '}{t('auth.and')}{' '}
              <span className="underline cursor-pointer" style={{ color: 'rgba(246,160,3,0.6)' }}>{t('auth.privacyPolicy')}</span>
            </p>
          </div>

          {/* Sign in link */}
          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/auth/login" className="font-semibold transition-colors" style={{ color: G.gold }}
              onMouseOver={e => e.currentTarget.style.color = '#ffb733'} onMouseOut={e => e.currentTarget.style.color = G.gold}>{t('auth.signIn')}</Link>
          </p>
        </motion.div>
      </div>

      {/* RIGHT — HERO IMAGE */}
      <div className="relative order-1 lg:order-2 lg:flex-1 h-52 sm:h-64 lg:h-auto overflow-hidden">
        <img src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b" alt="Luxury hotel room" className="absolute inset-0 w-full h-full object-cover" />

        {/* Overlays */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,13,26,0.9) 0%, rgba(13,13,26,0.3) 60%, transparent 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.95) 0%, transparent 55%)' }} />

        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 lg:top-0 lg:left-auto lg:right-0 lg:bottom-0 lg:w-0.5 lg:h-auto"
          style={{ background: 'linear-gradient(90deg, transparent, #f6a003, transparent)' }} />

        {/* Content */}
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 lg:bottom-12 lg:left-12 lg:right-12 text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>

            {/* Stars */}
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (<svg key={i} className="w-3.5 h-3.5" fill={G.gold} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>))}
              <span className="text-xs text-white/45 ml-1 font-medium">{t('auth.premiumMembership')}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('auth.joinElite')}<br />
              <span style={{ color: G.gold }}>{t('auth.eliteCircle')}</span>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">{t('auth.registerDescription')}</p>

            {/* Perks */}
            <div className="flex flex-col gap-2 mt-5 pt-5 border-t border-white/10">
              {[t('auth.perk1'), t('auth.perk2'), t('auth.perk3')].map(perk => (
                <div key={perk} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(246,160,3,0.15)', border: '1px solid rgba(246,160,3,0.3)' }}>
                    <Check className="w-2.5 h-2.5" style={{ color: G.gold }} strokeWidth={3} />
                  </div>
                  <span className="text-xs text-white/50 font-medium">{perk}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}