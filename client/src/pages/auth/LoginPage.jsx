import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Hotel, Lock, Mail, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const TEST_ACCOUNTS = [
  {
    label: 'Owner 1',
    email: 'james.harrington@luxhotel.com',
    password: 'OwnerPass@1',
    role: 'owner'
  },
  {
    label: 'Owner 2',
    email: 'sofia.alvarez@coastresort.com',
    password: 'OwnerPass@2',
    role: 'owner'
  },
  {
    label: 'Manager',
    email: 'david.park@luxhotel.com',
    password: 'StaffPass@123',
    role: 'manager'
  },
  {
    label: 'Reception',
    email: 'mia.thompson@luxhotel.com',
    password: 'StaffPass@123',
    role: 'reception'
  },
  {
    label: 'Customer 1',
    email: 'liam.johnson@gmail.com',
    password: 'Customer@123',
    role: 'customer'
  },
  {
    label: 'Customer 2',
    email: 'emma.wilson@gmail.com',
    password: 'Customer@123',
    role: 'customer'
  },
  {
    label: 'Customer 3',
    email: 'noah.davis@yahoo.com',
    password: 'Customer@123',
    role: 'customer'
  }
];
const ROLE_COLORS = {
  owner:      { bg: 'rgba(246,160,3,0.12)',  text: '#f6a003',  border: 'rgba(246,160,3,0.3)'  },
  manager:    { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6',  border: 'rgba(139,92,246,0.3)' },
  reception:  { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6',  border: 'rgba(59,130,246,0.3)' },
  customer:   { bg: 'rgba(16,185,129,0.12)', text: '#10b981',  border: 'rgba(16,185,129,0.3)' },
};

const G = { gold: '#f6a003', goldDark: '#d4880a' };

const InputField = ({ icon: Icon, label, error, right, isRtl, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-white/70 tracking-wide"
      style={{ textAlign: isRtl ? 'right' : 'left' }}>
      {label}
    </label>
    <div className="relative group">
      <Icon className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#f6a003] transition-colors duration-200 z-10"
        style={{ [isRtl ? 'right' : 'left']: 14 }} />
      <input
        {...props}
        className={`w-full py-3 rounded-xl text-sm text-white font-medium bg-white/[0.06] border transition-all duration-200 outline-none placeholder:text-white/25 ${
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-white/10 hover:border-white/20 focus:border-[#f6a003]/60 focus:ring-2 focus:ring-[#f6a003]/15'
        }`}
        style={{
          paddingLeft: isRtl ? 16 : 40,
          paddingRight: isRtl ? (right ? 44 : 16) : 16,
          textAlign: isRtl ? 'right' : 'left',
        }}
      />
      {right && <div className="absolute top-1/2 -translate-y-1/2 z-10" style={{ [isRtl ? 'left' : 'right']: 12 }}>{right}</div>}
    </div>
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { login, isLoading, error } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [showQuick, setShowQuick] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = async (e) => { e.preventDefault(); await login(form); };
  const quickLogin = (acc) => { setForm({ email: acc.email, password: acc.password }); login(acc); };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row" style={{ background: '#0d0d1a' }} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* LEFT — FORM PANEL */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 py-10 relative overflow-hidden order-2 lg:order-1">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #f6a003 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="pointer-events-none absolute -bottom-32 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f6a003 0%, transparent 70%)', filter: 'blur(50px)' }} />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="relative w-full max-w-[420px]">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${G.gold} 0%, #c8830a 100%)`, boxShadow: `0 8px 24px ${G.gold}73` }}>
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>LuxStay</span>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-white/40 text-sm font-medium">{t('auth.signInToDashboard')}</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-6 sm:p-8 space-y-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 font-medium" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField icon={Mail} label={t('auth.emailAddress')} type="email" name="email" value={form.email} onChange={handleChange} required placeholder={t('auth.emailPlaceholder')} autoComplete="email" isRtl={isRtl} />

              <InputField
                icon={Lock} label={t('auth.password')} type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" autoComplete="current-password" isRtl={isRtl}
                right={<button type="button" onClick={() => setShowPass(p => !p)} className="text-white/30 hover:text-[#f6a003] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>}
              />

              {/* Forgot password */}
              <div className="flex" style={{ justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                <Link to="/auth/forgot-password" className="text-xs font-medium transition-colors" style={{ color: 'rgba(246,160,3,0.7)' }}
                  onMouseOver={e => e.target.style.color = G.gold} onMouseOut={e => e.target.style.color = 'rgba(246,160,3,0.7)'}>{t('auth.forgotPassword')}</Link>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl text-sm font-bold text-white tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${G.gold} 0%, ${G.goldDark} 100%)`, boxShadow: `0 4px 20px ${G.gold}66` }}
                onMouseOver={e => !isLoading && (e.currentTarget.style.boxShadow = `0 6px 28px ${G.gold}8c`)}
                onMouseOut={e => e.currentTarget.style.boxShadow = `0 4px 20px ${G.gold}66`}>
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('auth.signIn')}
              </button>
            </form>

            {/* Quick login */}
            <div className="pt-1">
              <button onClick={() => setShowQuick(p => !p)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(246,160,3,0.3)'; e.currentTarget.style.color = G.gold; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                <div className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /><span>{t('auth.testAccounts')}</span></div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showQuick ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showQuick && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {TEST_ACCOUNTS.map((acc, i) => {
                        const c = ROLE_COLORS[acc.role] || ROLE_COLORS.customer;
                        return (
                          <motion.button key={acc.email} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => quickLogin(acc)}
                            className="rounded-xl px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.97]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textAlign: isRtl ? 'right' : 'left' }}
                            onMouseOver={e => { e.currentTarget.style.background = c.bg; e.currentTarget.style.borderColor = c.border; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-white/80">{acc.label}</span>
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{acc.role}</span>
                            </div>
                            <span className="text-[10px] block truncate text-white/30">{acc.email}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm mt-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {t('auth.noAccount')}{' '}
            <Link to="/auth/register" className="font-semibold transition-colors" style={{ color: G.gold }}
              onMouseOver={e => e.target.style.color = '#ffb733'} onMouseOut={e => e.target.style.color = G.gold}>{t('auth.createOne')}</Link>
          </p>
        </motion.div>
      </div>

      {/* RIGHT — HERO PANEL */}
      <div className="relative order-1 lg:order-2 lg:flex-1 h-56 sm:h-72 lg:h-auto overflow-hidden">
        <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945" alt="Luxury hotel" className="absolute inset-0 w-full h-full object-cover" />

        {/* Overlays */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(13,13,26,0.85) 0%, rgba(13,13,26,0.3) 60%, transparent 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,13,26,0.9) 0%, transparent 50%)' }} />

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
              <span className="text-xs text-white/50 ml-1 font-medium">{t('auth.fiveStarExperience')}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t('auth.experienceTrueLuxury')}<br />
              <span style={{ color: G.gold }}>{t('auth.trueLuxury')}</span>
            </h2>
            <p className="text-white/55 text-sm leading-relaxed max-w-sm">{t('auth.heroDescription')}</p>

            {/* Stats */}
            <div className="flex items-center gap-5 mt-6 pt-5 border-t border-white/10">
              {[
                { val: '200+', label: t('auth.hotels') },
                { val: '50K+', label: t('auth.guests') },
                { val: '4.9',  label: t('auth.rating') },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-base font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{s.val}</p>
                  <p className="text-xs text-white/40 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}