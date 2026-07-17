import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/utils/cn';
export const StatCard = ({ label, value, change, icon: Icon, positive, delay = 0, onClick }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
    onClick={onClick} className={cn('stat-card', onClick && 'cursor-pointer hover:border-amber-300')}>
    <div className="flex items-start justify-between">
      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-200"><Icon className="w-5 h-5 text-amber-500" /></div>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', positive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-600 bg-red-50 border border-red-200')}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{change}
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</p>
      <p className="text-sm text-neutral-400 mt-0.5">{label}</p>
    </div>
  </motion.div>
);
