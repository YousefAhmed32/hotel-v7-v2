import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { Hotel } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', className }) => {
  const { t } = useTranslation();
  const sizes = { sm:'w-4 h-4 border-2', md:'w-8 h-8 border-2', lg:'w-12 h-12 border-2', xl:'w-16 h-16 border-4' };
  return (
    <div className={cn('rounded-full border-neutral-200 border-t-amber-500 animate-spin', sizes[size], className)} />
  );
};

export const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-neutral-100 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shadow-sm">
        <Hotel className="w-8 h-8 text-amber-500" />
      </div>
      <div className="w-8 h-8 border-3 border-neutral-200 border-t-amber-500 rounded-full animate-spin border-2" />
      <p className="text-neutral-400 text-sm font-medium animate-pulse">Loading LuxStay…</p>
    </div>
  </div>
);
