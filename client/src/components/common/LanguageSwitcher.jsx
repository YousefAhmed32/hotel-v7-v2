import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Language switcher — toggles between EN and AR
 * Automatically applies dir="rtl/ltr" via i18n.on('languageChanged')
 */
export const LanguageSwitcher = ({ variant = 'icon', className }) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const toggle = () => i18n.changeLanguage(isAr ? 'en' : 'ar');

  if (variant === 'full') {
    return (
      <button onClick={toggle}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-sm font-semibold',
          'border-neutral-200 hover:border-amber-400 hover:bg-amber-50 text-neutral-600 hover:text-amber-700',
          className
        )}>
        <Globe className="w-4 h-4 flex-shrink-0" />
        <span>{isAr ? 'English' : 'عربي'}</span>
      </button>
    );
  }

  return (
    <button onClick={toggle} title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      className={cn(
        'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all',
        'border-neutral-200 hover:border-amber-400 hover:bg-amber-50 text-neutral-600 hover:text-amber-700',
        className
      )}>
      <Globe className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs font-bold tracking-wide">{isAr ? 'EN' : 'ع'}</span>
    </button>
  );
};
