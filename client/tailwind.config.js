/** @type {import('tailwindcss').Config} */
export default {
  future: { hoverOnlyWhenSupported: true },
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],

  theme: {
    extend: {

      /* ══════════════════════════════════════════
         COLOR SYSTEM
      ══════════════════════════════════════════ */
      colors: {

        /* ─ Brand gold (amber) ─ */
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#C9A84C',   /* PRIMARY brand gold */
          600: '#b8922a',   /* hover */
          700: '#9a771f',   /* pressed / text */
          800: '#7d5f1a',
          900: '#664e16',
          950: '#4a380f',
        },

        /* ─ Neutrals — cool-toned for sophistication ─ */
        neutral: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },

        /* ─ Dark palette (legacy + admin sidebar) ─ */
        dark: {
          50:  '#f6f6f7',
          100: '#e1e2e6',
          200: '#c3c4cc',
          300: '#9b9daa',
          400: '#73758a',
          500: '#595b70',
          600: '#46485a',
          700: '#2e3044',
          800: '#1a1c2e',
          900: '#0f1022',
          950: '#080914',
        },

        /* ─ Emerald — success, confirmed, paid ─ */
        emerald: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },

        /* ─ Sky / Blue — info, checked-in ─ */
        sky: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        blue: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },

        /* ─ Red — danger, rejected, cancelled ─ */
        red: {
          50:  '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },

        /* ─ Purple — checked-out ─ */
        purple: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },

        /* ─ Shadcn/Radix semantic tokens ─ */
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover, var(--card)))',
          foreground: 'hsl(var(--popover-foreground, var(--card-foreground)))',
        },
      },

      /* ══════════════════════════════════════════
         TYPOGRAPHY
      ══════════════════════════════════════════ */
      fontFamily: {
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem',  { lineHeight: '1rem' }],
        xs:    ['0.75rem',   { lineHeight: '1.125rem' }],
        sm:    ['0.875rem',  { lineHeight: '1.375rem' }],
        base:  ['1rem',      { lineHeight: '1.625rem' }],
        lg:    ['1.125rem',  { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',   { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',    { lineHeight: '2rem' }],
        '3xl': ['1.875rem',  { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem',   { lineHeight: '2.75rem' }],
        '5xl': ['3rem',      { lineHeight: '1.2',    letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem',   { lineHeight: '1.1',    letterSpacing: '-0.03em' }],
      },

      fontWeight: {
        thin:       '100',
        light:      '300',
        normal:     '400',
        medium:     '500',
        semibold:   '600',
        bold:       '700',
        extrabold:  '800',
        black:      '900',
      },

      letterSpacing: {
        tighter: '-0.04em',
        tight:   '-0.02em',
        normal:  '0',
        wide:    '0.04em',
        wider:   '0.08em',
        widest:  '0.16em',
      },

      /* ══════════════════════════════════════════
         SPACING
      ══════════════════════════════════════════ */
      spacing: {
        '4.5':  '1.125rem',
        '5.5':  '1.375rem',
        '13':   '3.25rem',
        '15':   '3.75rem',
        '18':   '4.5rem',
        '22':   '5.5rem',
        '26':   '6.5rem',
        '30':   '7.5rem',
        '88':   '22rem',
        '92':   '23rem',
        '100':  '25rem',
        '108':  '27rem',
        '120':  '30rem',
        '128':  '32rem',
      },

      /* ══════════════════════════════════════════
         BORDER RADIUS
      ══════════════════════════════════════════ */
      borderRadius: {
        none:  '0',
        sm:    'calc(var(--radius) - 4px)',   /* 8px */
        md:    'calc(var(--radius) - 2px)',   /* 10px */
        DEFAULT: 'var(--radius)',             /* 12px */
        lg:    'var(--radius)',               /* 12px */
        xl:    '1rem',                        /* 16px */
        '2xl': '1.25rem',                     /* 20px */
        '3xl': '1.5rem',                      /* 24px */
        '4xl': '2rem',                        /* 32px */
        full:  '9999px',
      },

      /* ══════════════════════════════════════════
         SHADOWS
      ══════════════════════════════════════════ */
      boxShadow: {
        xs:          '0 1px 2px rgba(0,0,0,0.05)',
        sm:          '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        card:        '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover':'0 4px 24px rgba(0,0,0,0.10)',
        md:          '0 4px 16px rgba(0,0,0,0.08)',
        lg:          '0 8px 32px rgba(0,0,0,0.10)',
        xl:          '0 16px 48px rgba(0,0,0,0.12)',
        '2xl':       '0 24px 64px rgba(0,0,0,0.16)',
        inner:       'inset 0 1px 3px rgba(0,0,0,0.08)',
        'inner-gold':'inset 0 1px 0 rgba(255,255,255,0.15)',

        /* Gold glow family */
        gold:        '0 0 20px rgba(201,168,76,0.15)',
        'gold-sm':   '0 2px 8px rgba(201,168,76,0.20)',
        'gold-md':   '0 4px 20px rgba(201,168,76,0.28)',
        'gold-lg':   '0 8px 40px rgba(201,168,76,0.35)',
        'gold-xl':   '0 16px 60px rgba(201,168,76,0.40)',

        /* Status shadows */
        'emerald':   '0 4px 16px rgba(16,185,129,0.20)',
        'red':       '0 4px 16px rgba(239,68,68,0.20)',
        'blue':      '0 4px 16px rgba(59,130,246,0.20)',

        none: 'none',
      },

      /* ══════════════════════════════════════════
         BACKGROUND IMAGES / GRADIENTS
      ══════════════════════════════════════════ */
      backgroundImage: {
        /* Brand gradients */
        'gold-gradient':       'linear-gradient(135deg, #C9A84C 0%, #f5e07b 50%, #C9A84C 100%)',
        'gold-gradient-soft':  'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(245,224,123,0.06) 100%)',
        'gold-gradient-text':  'linear-gradient(135deg, #9a771f 0%, #C9A84C 40%, #f5e07b 70%, #b8922a 100%)',

        /* Dark gradients (sidebar, admin) */
        'dark-gradient':       'linear-gradient(135deg, #0f1022 0%, #1a1c2e 100%)',
        'sidebar-gradient':    'linear-gradient(180deg, #0f1022 0%, #1a1c2e 100%)',
        'dark-card-gradient':  'linear-gradient(135deg, #1a1c2e 0%, #2e3044 100%)',

        /* Ambient radials */
        'ambient-warm':        'radial-gradient(ellipse at top, rgba(201,168,76,0.08) 0%, transparent 60%)',
        'ambient-cool':        'radial-gradient(ellipse at bottom, rgba(59,130,246,0.06) 0%, transparent 60%)',

        /* Card shimmer */
        'shimmer':             'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
      },

      /* ══════════════════════════════════════════
         TRANSITIONS
      ══════════════════════════════════════════ */
      transitionTimingFunction: {
        'bounce-soft':  'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':       'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-expo':     'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-back':     'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-out-circ':  'cubic-bezier(0.85, 0, 0.15, 1)',
      },
      transitionDuration: {
        '0':    '0ms',
        '75':   '75ms',
        '100':  '100ms',
        '150':  '150ms',
        '200':  '200ms',
        '250':  '250ms',
        '300':  '300ms',
        '400':  '400ms',
        '500':  '500ms',
        '700':  '700ms',
        '1000': '1000ms',
      },

      /* ══════════════════════════════════════════
         ANIMATIONS
      ══════════════════════════════════════════ */
      animation: {
        'fade-in':       'fade-in 0.3s ease-out both',
        'slide-up':      'slide-up 0.4s ease-out both',
        'slide-down':    'slide-down 0.3s ease-out both',
        'scale-in':      'scale-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-gold':    'pulse-gold 2s ease-in-out infinite',
        'shimmer':       'skeleton-sweep 1.8s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'spin-slow':     'spin-slow 3s linear infinite',
        'pulse-dot':     'pulse-dot 2s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out infinite',
      },

      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.4)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(201,168,76,0)' },
        },
        'skeleton-sweep': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':       { opacity: '0.6', transform: 'scale(0.85)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.7' },
        },
      },

      /* ══════════════════════════════════════════
         MISC
      ══════════════════════════════════════════ */
      screens: {
        xs:  '480px',
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },

      maxWidth: {
        '8xl':  '88rem',
        '9xl':  '96rem',
        '10xl': '104rem',
      },

      zIndex: {
        1:    '1',
        2:    '2',
        dropdown:  '1000',
        sticky:    '1020',
        fixed:     '1030',
        modal:     '1050',
        popover:   '1060',
        tooltip:   '1070',
        toast:     '1080',
      },

      aspectRatio: {
        'hotel': '16 / 9',
        'card':  '4 / 3',
        'room':  '3 / 2',
        'square': '1 / 1',
        'portrait': '2 / 3',
      },

      backdropBlur: {
        xs:   '2px',
        sm:   '4px',
        md:   '8px',
        lg:   '16px',
        xl:   '24px',
        '2xl': '40px',
      },
    },
  },

  plugins: [],
};