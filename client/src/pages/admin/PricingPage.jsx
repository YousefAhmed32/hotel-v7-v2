import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Check, X, Edit3, Zap, BarChart3, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchPricingSuggestions, applyPrice, ignoreSuggestion, selectSuggestions, selectPricingLoading } from '@/features/pricing/pricingSlice';
import { selectUserHotelId } from '@/features/auth/authSlice';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const G = { 500: '#f6a003', 600: '#e09200', 50: '#fff8ed', 200: '#fde08a', ring: 'rgba(246,160,3,0.20)' };

const SignalBar = ({ label, value }) => {
  const color = value >= 70 ? '#16a34a' : value >= 40 ? '#f6a003' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#8a7560] uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-bold text-[#1a1410]">{value}%</span>
      </div>
      <div className="h-1.5 bg-[#f0e8d8] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: value + '%' }} transition={{ duration: 0.9, ease: 'easeOut' }} style={{ backgroundColor: color }} className="h-full rounded-full" />
      </div>
    </div>
  );
};

const InfoCard = ({ icon: Icon, emoji, title, desc, accent }) => (
  <div className="bg-white rounded-2xl border border-[#f0e8d8] p-5 shadow-sm flex gap-4 items-start hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: G[50], border: '1px solid #f0e8d8' }}>
      {emoji ? <span className="text-lg">{emoji}</span> : <Icon className="w-5 h-5" style={{ color: G[500] }} />}
    </div>
    <div>
      <p className="text-sm font-bold text-[#1a1410]">{title}</p>
      <p className="text-xs text-[#8a7560] mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
);

const SuggestionCard = ({ suggestion, onApply, onIgnore, isApplying, index, t }) => {
  const [override, setOverride] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [showSignals, setShowSignals] = useState(false);

  const { roomName, basePrice, suggestedPrice, finalMultiplier, signals, explanation } = suggestion;
  const isIncrease = suggestedPrice > basePrice;
  const pctChange = Math.round(Math.abs(finalMultiplier - 1) * 100);

  const signalList = signals ? [
    { label: t('pricing.occupancy'), value: signals.occupancyRate ?? signals.occupancyScore },
    { label: t('pricing.season'),    value: signals.seasonScore },
    { label: t('pricing.demand'),    value: signals.demandScore },
  ].filter(s => s.value != null) : [];

  return (
    <motion.div layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-[#f0e8d8] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="h-0.5 w-full" style={{ background: isIncrease ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#f6a003,#ffc843)' }} />

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-bold text-[#1a1410] text-base leading-tight">{roomName}</h4>
            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-xs text-[#8a7560]">{t('pricing.base')} <span className="font-semibold text-[#1a1410]">{formatCurrency(basePrice)}</span></span>
              <span className="text-[#c4a882] text-xs">→</span>
              <span className={cn('text-sm font-extrabold', isIncrease ? 'text-emerald-600' : 'text-[#f6a003]')}>{formatCurrency(suggestedPrice)}</span>
              <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full', isIncrease ? 'bg-emerald-50 text-emerald-600' : 'bg-[#fff8ed] text-[#f6a003]')}>
                {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {pctChange}%
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-[#8a7560] uppercase tracking-wider">{t('pricing.multiplier')}</p>
            <p className="font-mono text-base font-extrabold text-[#1a1410]">{finalMultiplier}×</p>
          </div>
        </div>

        {explanation?.[0] && (
          <p className="text-xs text-[#8a7560] italic bg-[#fefcf7] rounded-xl px-3 py-2.5 leading-relaxed border border-[#f0e8d8]">{explanation[0]}</p>
        )}

        {signalList.length > 0 && (
          <div>
            <button onClick={() => setShowSignals(v => !v)} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8a7560] hover:text-[#f6a003] transition-colors mb-2">
              <BarChart3 className="w-3.5 h-3.5" /> {showSignals ? t('pricing.hideSignals') : t('pricing.showSignals')}
            </button>
            <AnimatePresence>
              {showSignals && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                  {signalList.map(s => <SignalBar key={s.label} {...s} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {override && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <input type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)}
                placeholder={`${t('pricing.custom')}: ${suggestedPrice}`}
                className="w-full px-3 py-2.5 rounded-xl border border-[#f0e8d8] bg-[#fefcf7] text-[#1a1410] text-sm placeholder-[#c4a882] focus:outline-none focus:border-[#f6a003] focus:ring-2 transition-all" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 pt-1">
          <button onClick={() => onApply(suggestion, override && customPrice ? parseFloat(customPrice) : null)} disabled={isApplying || (override && !customPrice)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-white text-xs font-bold shadow-[0_3px_12px_rgba(246,160,3,0.35)] hover:shadow-[0_4px_18px_rgba(246,160,3,0.45)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            style={{ background: isApplying ? 'rgba(246,160,3,0.6)' : '#f6a003' }}>
            {isApplying ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            {override ? t('pricing.applyCustom') : t('pricing.applyPrice')}
          </button>

          <button onClick={() => setOverride(p => !p)} title={t('pricing.setCustom')}
            className={cn('p-2.5 rounded-xl border transition-all duration-150', override ? 'border-[#f6a003] bg-[#fff8ed] text-[#f6a003]' : 'border-[#f0e8d8] text-[#8a7560] hover:border-[#f6a003] hover:text-[#f6a003] hover:bg-[#fff8ed]')}>
            <Edit3 className="w-4 h-4" />
          </button>

          <button onClick={() => onIgnore(suggestion)} disabled={isApplying} title={t('pricing.dismiss')}
            className="p-2.5 rounded-xl border border-[#f0e8d8] text-[#8a7560] hover:border-red-200 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-all duration-150">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function PricingPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hotelId = useSelector(selectUserHotelId);
  const suggestions = useSelector(selectSuggestions);
  const isLoading = useSelector(selectPricingLoading);
  const [applying, setApplying] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (hotelId) dispatch(fetchPricingSuggestions({ hotelId }));
  }, [dispatch, hotelId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchPricingSuggestions({ hotelId }));
    setRefreshing(false);
  };

  const handleApply = async (suggestion, overridePrice) => {
    setApplying(suggestion.roomId);
    try {
      await dispatch(applyPrice({ hotelId, roomId: suggestion.roomId, suggestedPrice: suggestion.suggestedPrice, overridePrice })).unwrap();
      toast.success(t('pricing.applySuccess', { room: suggestion.roomName }));
    } catch (err) { toast.error(err || t('common.failed')); }
    finally { setApplying(null); }
  };

  const handleIgnore = async (suggestion) => {
    try {
      await dispatch(ignoreSuggestion({ hotelId, roomId: suggestion.roomId })).unwrap();
      toast.success(t('pricing.dismissed'));
    } catch {}
  };

  const upCount = suggestions.filter(s => s.suggestedPrice > s.basePrice).length;
  const downCount = suggestions.filter(s => s.suggestedPrice < s.basePrice).length;

  return (
    <div className="min-h-screen" style={{ background: G[50] }}>
      <div className="h-1 w-full bg-gradient-to-r from-[#f6a003] via-[#ffc843] to-[#f6a003]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">

        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f6a003] flex items-center justify-center shadow-[0_4px_14px_rgba(246,160,3,0.35)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1410] tracking-tight leading-none">{t('pricing.title')}</h1>
                <p className="text-[#8a7560] text-sm mt-0.5">{t('pricing.subtitle')}</p>
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {[
                  { label: t('pricing.pending'),    value: suggestions.length, color: '#f6a003' },
                  { label: t('pricing.increases'),  value: upCount,   color: '#16a34a' },
                  { label: t('pricing.decreases'),  value: downCount, color: '#f6a003' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex flex-col items-center px-4 py-2.5 rounded-2xl bg-[#fff8ed] border border-[#f0e8d8] min-w-[80px]">
                    <span className="text-xl font-extrabold leading-none" style={{ color }}>{value}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8a7560] mt-0.5">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleRefresh} disabled={refreshing || isLoading}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#f0e8d8] bg-white text-[#8a7560] text-sm font-semibold hover:border-[#f6a003]/50 hover:text-[#f6a003] hover:bg-[#fff8ed] disabled:opacity-60 transition-all duration-200 shadow-sm">
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            {t('pricing.refresh')}
          </button>
        </motion.div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#f0e8d8] to-transparent" />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoCard icon={Zap} emoji="🧠" title={t('pricing.signals')} desc={t('pricing.signalsDesc')} />
          <InfoCard icon={BarChart3} emoji="📊" title={t('pricing.range')} desc={t('pricing.rangeDesc')} />
          <InfoCard icon={Clock} emoji="🔄" title={t('pricing.refresh')} desc={t('pricing.refreshDesc')} />
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#f6a003] animate-pulse" />
            </div>
            <p className="text-sm text-[#8a7560] animate-pulse">{t('pricing.generating')}</p>
          </div>
        ) : suggestions.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl border border-[#f0e8d8] p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-[#fff8ed] border border-[#f0e8d8] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#c4a882]" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1410] mb-1">{t('pricing.noSuggestions')}</h3>
            <p className="text-sm text-[#8a7560]">{t('pricing.noSuggestionsDesc')}</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {suggestions.map((s, i) => (
                <SuggestionCard key={s.roomId} suggestion={s} index={i} onApply={handleApply} onIgnore={handleIgnore} isApplying={applying === s.roomId} t={t} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}