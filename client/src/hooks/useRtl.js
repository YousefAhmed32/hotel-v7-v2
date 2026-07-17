import { useTranslation } from 'react-i18next';

/**
 * Convenience hook for RTL-aware rendering.
 * Usage:
 *   const { isRtl, dir, flipIcon } = useRtl();
 */
export const useRtl = () => {
  const { i18n } = useTranslation();
  const isRtl  = i18n.language === 'ar';
  const dir    = isRtl ? 'rtl' : 'ltr';

  // Returns a className that flips directional SVG icons (arrows, chevrons)
  const flipIcon = isRtl ? 'scale-x-[-1]' : '';

  // Returns inline style for start/end padding (replaces left/right)
  const ps = (val) => isRtl ? { paddingRight: val } : { paddingLeft: val };  // padding-start
  const pe = (val) => isRtl ? { paddingLeft: val  } : { paddingRight: val }; // padding-end
  const ms = (val) => isRtl ? { marginRight: val  } : { marginLeft: val };   // margin-start
  const me = (val) => isRtl ? { marginLeft: val   } : { marginRight: val };  // margin-end

  return { isRtl, dir, flipIcon, ps, pe, ms, me };
};
