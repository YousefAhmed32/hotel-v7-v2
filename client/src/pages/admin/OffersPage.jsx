import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, X, ToggleLeft, ToggleRight, Trash2, Percent, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';
import api from '@/services/api';

const defaultForm = { code:'', name:'', discountType:'percentage', discountValue:'', minBookingAmount:'', usageLimit:'', perUserLimit:1, expiresAt:'' };

export default function OffersPage() {
  const { t } = useTranslation();
  const hotelId = useSelector(selectUserHotelId);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState(defaultForm);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = async () => {
    if (!hotelId) return;
    try { setLoading(true); const { data } = await api.get(`/hotels/${hotelId}/coupons`, { params: { limit:50 } }); setCoupons(data.data || []); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [hotelId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || form.code.length < 3) { toast.error(t('offers.codeRequired')); return; }
    if (!form.name.trim()) { toast.error(t('offers.nameRequired')); return; }
    if (!form.discountValue || parseFloat(form.discountValue) <= 0) { toast.error(t('offers.discountRequired')); return; }
    if (form.discountType === 'percentage' && parseFloat(form.discountValue) > 100) { toast.error(t('offers.percentageMax')); return; }
    if (!hotelId) { toast.error(t('offers.noHotel')); return; }
    setSaving(true);
    try {
      const payload = {
        code:              form.code.toUpperCase().trim(),
        name:              form.name.trim(),
        discountType:      form.discountType,
        discountValue:     parseFloat(form.discountValue),
        minBookingAmount:  form.minBookingAmount ? parseFloat(form.minBookingAmount) : 0,
        usageLimit:        form.usageLimit ? parseInt(form.usageLimit) : null,
        perUserLimit:      parseInt(form.perUserLimit) || 1,
        expiresAt:         form.expiresAt || null,
      };
      const { data } = await api.post('/hotels/' + hotelId + '/coupons', payload);
      setCoupons(p => [data.data.coupon, ...p]);
      toast.success(t('offers.couponCreated', { code: payload.code }));
      setFormOpen(false); setForm(defaultForm);
    } catch (err) {
      console.error('Coupon error:', err.response?.data);
      toast.error(err.response?.data?.message || t('offers.createFailed'));
    }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try { const { data } = await api.patch(`/hotels/${hotelId}/coupons/${id}/toggle`); setCoupons(p => p.map(c => c._id === id ? data.data.coupon : c)); toast.success(data.message); }
    catch (err) { toast.error(err.response?.data?.message || t('common.failed')); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('offers.deleteConfirm'))) return;
    try { await api.delete(`/hotels/${hotelId}/coupons/${id}`); setCoupons(p => p.filter(c => c._id !== id)); toast.success(t('offers.deleted')); }
    catch (err) { toast.error(err.response?.data?.message || t('common.failed')); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><Tag className="w-5 h-5" style={{ color: '#f6a003' }} /><h1 className="text-2xl font-semibold text-neutral-900">{t('offers.title')}</h1></div>
          <p className="text-neutral-400 text-sm mt-1">{coupons.length} {t('offers.coupons')}</p>
        </div>
        <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold flex-shrink-0 shadow-sm transition-all" style={{ background: '#f6a003' }} onMouseEnter={e => e.target.style.background = '#e09200'} onMouseLeave={e => e.target.style.background = '#f6a003'}>
          <Plus className="w-4 h-4" /> {t('offers.newCoupon')}
        </button>
      </div>
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #f0e8d8, transparent)' }} />

      {loading ? <div className="flex justify-center py-20"><LoadingSpinner size="xl" /></div>
      : coupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-20 text-center shadow-sm">
          <Tag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-400 font-medium">{t('offers.noCoupons')}</p>
          <button onClick={() => setFormOpen(true)} className="text-sm px-5 py-2 mt-4 inline-flex items-center gap-1.5 rounded-xl text-white flex-shrink-0" style={{ background: '#f6a003' }}>
            <Plus className="w-4 h-4" /> {t('offers.createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map(coupon => (
            <motion.div key={coupon._id} initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
              className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-lg font-bold" style={{ color: '#f6a003' }}>{coupon.code}</p>
                  <p className="text-sm text-neutral-700 mt-0.5">{coupon.name}</p>
                </div>
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', coupon.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-400 border-neutral-200')}>
                  {coupon.isActive ? t('offers.active') : t('offers.inactive')}
                </span>
              </div>
              <div className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t('offers.discount')}</span>
                  <span className="font-semibold text-neutral-800 flex items-center gap-1">
                    {coupon.discountType === 'percentage' ? <Percent className="w-3.5 h-3.5" style={{ color: '#f6a003' }} /> : <DollarSign className="w-3.5 h-3.5" style={{ color: '#f6a003' }} />}
                    {coupon.discountType === 'percentage' ? coupon.discountValue + '%' : formatCurrency(coupon.discountValue)} {t('offers.off')}
                  </span>
                </div>
                {coupon.minBookingAmount > 0 && (
                  <div className="flex justify-between"><span className="text-neutral-400">{t('offers.minBooking')}</span><span className="text-neutral-700">{formatCurrency(coupon.minBookingAmount)}</span></div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t('offers.used')}</span>
                  <span className="text-neutral-700">{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ` (${t('offers.unlimited')})`}</span>
                </div>
                {coupon.expiresAt && (
                  <div className="flex justify-between"><span className="text-neutral-400">{t('offers.expires')}</span><span className="text-neutral-700">{formatDate(coupon.expiresAt, 'MMM d, yyyy')}</span></div>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-neutral-100">
                <button onClick={() => handleToggle(coupon._id)}
                  className={cn('flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors border',
                    coupon.isActive ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50')}>
                  {coupon.isActive ? <><ToggleLeft className="w-3.5 h-3.5" /> {t('offers.deactivate')}</> : <><ToggleRight className="w-3.5 h-3.5" /> {t('offers.activate')}</>}
                </button>
                <button onClick={() => handleDelete(coupon._id)}
                  className="p-1.5 rounded-xl border border-neutral-200 text-neutral-400 hover:border-red-200 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* create modal */}
      <AnimatePresence>
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setFormOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] z-10">
              <div className="flex items-center justify-between p-5 border-b border-neutral-100">
                <h2 className="font-bold text-neutral-900">{t('offers.newCoupon')}</h2>
                <button onClick={() => setFormOpen(false)} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500">{t('offers.code')} *</label><input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} required className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 font-mono uppercase outline-none focus:border-[#f6a003] focus:ring-2 transition-all" style={{ '--focus-color': '#f6a003' }} placeholder="SUMMER25" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500">{t('offers.name')} *</label><input value={form.name} onChange={e => set('name', e.target.value)} required className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#f6a003] focus:ring-2 transition-all" placeholder="Summer Deal" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500">{t('offers.type')} *</label>
                    <select value={form.discountType} onChange={e => set('discountType', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#f6a003] focus:ring-2 transition-all">
                      <option value="percentage">{t('offers.percentage')}</option><option value="fixed">{t('offers.fixed')}</option>
                    </select></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500">{t('offers.value')} *</label><input type="number" min="0.01" step="0.01" value={form.discountValue} onChange={e => set('discountValue', e.target.value)} required className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#f6a003] focus:ring-2 transition-all" placeholder={form.discountType === 'percentage' ? '25' : '50'} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500">{t('offers.minBooking')}</label><input type="number" min="0" value={form.minBookingAmount} onChange={e => set('minBookingAmount', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#f6a003] focus:ring-2 transition-all" placeholder="100" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500">{t('offers.usageLimit')}</label><input type="number" min="1" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#f6a003] focus:ring-2 transition-all" placeholder={t('offers.unlimited')} /></div>
                </div>
                <div className="space-y-1.5"><label className="text-xs font-medium text-neutral-500">{t('offers.expiresAt')}</label><input type="datetime-local" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-[#f6a003] focus:ring-2 transition-all" /></div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setFormOpen(false)} className="btn-outline flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-all py-2.5" style={{ background: '#f6a003' }}>
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('offers.createCoupon')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}