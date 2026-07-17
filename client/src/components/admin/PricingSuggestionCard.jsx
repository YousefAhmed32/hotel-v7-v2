import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Check, X, Edit3 } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';
export const PricingSuggestionCard = ({ suggestion, onApply, onIgnore, isLoading }) => {
  const [overrideMode, setOverrideMode] = useState(false);
  const [overridePrice, setOverridePrice] = useState('');
  const { roomName, basePrice, suggestedPrice, finalMultiplier, signals, explanation } = suggestion;
  const isIncrease = suggestedPrice > basePrice;
  const pctChange = Math.round(Math.abs(finalMultiplier - 1) * 100);
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="luxury-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-neutral-900">{roomName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-neutral-400">Base: {formatCurrency(basePrice)}</span>
            <span className="text-neutral-500">→</span>
            <span className={cn('text-sm font-bold', isIncrease ? 'text-emerald-400' : 'text-amber-400')}>{formatCurrency(suggestedPrice)}</span>
            <span className={cn('flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded', isIncrease ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
              {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{pctChange}%
            </span>
          </div>
        </div>
        <span className="text-xs text-neutral-400 font-mono">x{finalMultiplier}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[{ label: 'Occupancy', value: signals.occupancyRate }, { label: 'Season', value: signals.seasonScore }, { label: 'Demand', value: signals.demandScore }].map(({ label, value }) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between"><span className="text-xs text-neutral-400">{label}</span><span className="text-xs text-neutral-400">{value}%</span></div>
            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: value + '%' }} transition={{ duration: 0.8, ease: 'easeOut' }} className={cn('h-full rounded-full', value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500')} />
            </div>
          </div>
        ))}
      </div>
      {explanation?.[0] && <p className="text-xs text-neutral-400 mb-4 italic">"{explanation[0]}"</p>}
      {overrideMode && <div className="flex gap-2 mb-3"><input type="number" value={overridePrice} onChange={e => setOverridePrice(e.target.value)} placeholder={'Custom price (suggested: ' + suggestedPrice + ')'} className="luxury-input flex-1 text-sm" /></div>}
      <div className="flex gap-2">
        <button onClick={() => onApply(suggestion, overrideMode ? parseFloat(overridePrice) : null)} disabled={isLoading || (overrideMode && !overridePrice)} className="btn-gold flex-1 text-sm py-2 flex items-center justify-center gap-1 disabled:opacity-60"><Check className="w-3.5 h-3.5" />{overrideMode ? 'Apply Custom' : 'Apply'}</button>
        <button onClick={() => setOverrideMode(!overrideMode)} className={cn('p-2 rounded-lg border transition-colors', overrideMode ? 'border-amber-300 text-amber-500 bg-amber-500/10' : 'border-neutral-200 text-neutral-400 hover:border-neutral-300')}><Edit3 className="w-4 h-4" /></button>
        <button onClick={() => onIgnore(suggestion)} disabled={isLoading} className="p-2 rounded-lg border border-neutral-200 text-neutral-400 hover:border-red-500/30 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
      </div>
    </motion.div>
  );
};
