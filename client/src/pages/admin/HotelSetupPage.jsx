import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hotel, MapPin, Star, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { hotelApi } from '@/services/hotelApi';
import { reissueTokens } from '@/features/auth/authSlice';

const COUNTRIES = ['Egypt', 'Saudi Arabia', 'UAE', 'Jordan', 'Morocco', 'Tunisia', 'Kuwait', 'Bahrain', 'Qatar', 'Oman'];

export default function HotelSetupPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', starRating: 4,
    address: { city: '', country: 'Egypt', street: '' },
    contact: { phone: '', email: '', website: '' },
  });

  const set = (path, val) => {
    const parts = path.split('.');
    if (parts.length === 1) setForm(p => ({ ...p, [path]: val }));
    else setForm(p => ({ ...p, [parts[0]]: { ...p[parts[0]], [parts[1]]: val } }));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || form.name.length < 3) { toast.error(t('setup.nameRequired')); return; }
    if (!form.address.city.trim()) { toast.error(t('setup.cityRequired')); return; }
    if (!form.address.country.trim()) { toast.error(t('setup.countryRequired')); return; }
    setSaving(true);
    try {
      const { data } = await hotelApi.create(form);
      localStorage.setItem('accessToken', data.data.accessToken);
      await dispatch(reissueTokens());
      toast.success(t('setup.hotelCreated', { name: form.name }));
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || t('setup.failedCreate'));
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6A003]/10 via-white to-neutral-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#F6A003]/10 border border-[#F6A003]/20 flex items-center justify-center mx-auto mb-4">
            <Hotel className="w-8 h-8 text-[#F6A003]" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-neutral-900">{t('setup.title')}</h1>
          <p className="text-neutral-500 mt-2">{t('setup.subtitle')}</p>
        </motion.div>

        {/* progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step >= n ? 'bg-[#F6A003] text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                {n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step >= n ? 'text-neutral-700' : 'text-neutral-400'}`}>
                {n === 1 ? t('setup.basicInfo') : t('setup.contactLaunch')}
              </span>
              {n < 2 && <div className={`w-16 h-px ${step > 1 ? 'bg-[#F6A003]/80' : 'bg-neutral-200'}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: step === 1 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700">{t('setup.hotelName')} *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 text-base outline-none focus:border-[#F6A003] transition-colors" placeholder={t('setup.hotelNamePlaceholder')} autoFocus />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700">{t('setup.starRating')} *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => set('starRating', n)}
                      className={`w-11 h-11 rounded-xl border text-lg transition-all font-bold
                        ${n <= form.starRating ? 'bg-[#F6A003]/10 border-[#F6A003] text-[#F6A003]' : 'border-neutral-200 text-neutral-300 hover:border-neutral-300'}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">{t('setup.city')} *</label>
                  <input value={form.address.city} onChange={e => set('address.city', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#F6A003] transition-colors" placeholder={t('setup.cityPlaceholder')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-700">{t('setup.country')} *</label>
                  <select value={form.address.country} onChange={e => set('address.country', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#F6A003] transition-colors">
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-neutral-700">{t('setup.street')}</label>
                <input value={form.address.street} onChange={e => set('address.street', e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#F6A003] transition-colors" placeholder={t('setup.streetPlaceholder')} />
              </div>

              <button onClick={() => {
                if (!form.name.trim() || !form.address.city.trim()) { toast.error(t('setup.fillRequired')); return; }
                setStep(2);
              }} className="w-full py-3 px-4 bg-[#F6A003] hover:bg-[#d98e02] text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-base transition-colors">
                {t('setup.nextStep')} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-5">
              <div className="p-4 bg-[#F6A003]/10 rounded-xl border border-[#F6A003]/20">
                <p className="text-sm font-semibold text-[#b87900]">{form.name}</p>
                <p className="text-xs text-[#d98e02] mt-0.5">{form.address.city}, {form.address.country} · {'★'.repeat(form.starRating)}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 px-4 border border-neutral-200 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-50 transition-colors">
                  ← {t('setup.back')}
                </button>
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 py-3 px-4 bg-[#F6A003] hover:bg-[#d98e02] disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-base transition-colors">
                  {saving
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {t('setup.creating')}</>
                    : <><Hotel className="w-5 h-5" /> {t('setup.createHotel')}</>}
                </button>
              </div>

              <p className="text-center text-xs text-neutral-400">
                {t('setup.addAfter')}
              </p>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}