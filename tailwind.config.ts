import type { Config } from 'tailwindcss';

/**
 * Cohort mobile-first Tailwind config.
 * Brand: deep pomegranate red (Aurora) + soft amber (Vesper), warm ivory ground, off-black text.
 * Mobile-first: base classes target mobile, sm/md/lg/xl/2xl progressively enhance.
 *
 * Token source of truth: 42-typography-color-system.md §6.2 + 40-design-system-architecture.md §2.
 * All additions are additive — existing cohort/aurora/vesper palettes unchanged.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Core Cohort brand palette + ink scale + semantic state colors (42 §6.2)
        cohort: {
          primary: '#A8243F', // deep pomegranate red (primary)
          amber: '#E8A33D', // soft amber accent (Vesper highlight)
          ivory: '#F8F4ED', // warm ivory background
          charcoal: '#1A1A1A', // off-black text

          // Ink scale — neutral text/border ramp (42 §6.2 / 40 §2.1)
          'ink-90': '#1A1A1A', // primary text (= charcoal)
          'ink-70': '#404040', // secondary text
          'ink-50': '#7A7A7A', // tertiary text + disabled
          'ink-30': '#B0B0B0', // hint text + placeholders
          'ink-10': '#E0E0E0', // dividers + borders
          'ink-05': '#F0EBE3', // ivory-tinted divider

          // Semantic state colors — single values (42 §6.2 / 40 §2.1)
          success: '#5B8C5A', // muted sage (dovish prosperity)
          warning: '#C97E3E', // burnt orange (alert)
          danger: '#8A1A30', // deep wine (concerned)
          info: '#4A6A8E', // muted navy (analytical)
        },
        // Aurora (Dove) — 6 dynamic mascot states, pomegranate-anchored
        aurora: {
          calm: '#A8243F', // pomegranate (default)
          alert: '#C8523F',
          happy: '#B8943D',
          concerned: '#8A1A30',
          proud: '#D4B872',
          reflective: '#666666',
        },
        // Vesper (Hawk) — 6 dynamic mascot states, amber-anchored
        vesper: {
          calm: '#E8A33D', // amber (default)
          alert: '#FF6B35',
          happy: '#FFC857',
          concerned: '#8B4513',
          proud: '#FFD700',
          reflective: '#5C5C5C',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        // Figures + financial values only (never body text) — 42 §1.4
        mono: ['Berkeley Mono', 'JetBrains Mono', 'monospace'],
      },
      // Type scale — Tailwind default overrides, Korean-cluster line-heights (42 §6.2 / §1.2)
      fontSize: {
        xs: ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
        sm: ['13px', { lineHeight: '20px', letterSpacing: '0.01em' }],
        base: ['16px', { lineHeight: '24px', letterSpacing: '0' }],
        lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        xl: ['22px', { lineHeight: '32px', letterSpacing: '-0.015em' }],
        '2xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        '3xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.025em' }],
        '4xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.03em' }],
        '5xl': ['64px', { lineHeight: '72px', letterSpacing: '-0.035em' }],
      },
      boxShadow: {
        // Subtle mascot glow — calm + sophisticated, not flashy (42 §6.2 / 40 §2.5)
        'mascot-aurora': '0 4px 16px rgba(168, 36, 63, 0.15)',
        'mascot-vesper': '0 4px 16px rgba(232, 163, 61, 0.15)',
      },
      transitionDuration: {
        fast: '150ms', // micro (button press, hover)
        DEFAULT: '250ms', // standard (state change, modal open)
        slow: '400ms', // emphasis (mascot state transition)
        slower: '600ms', // dramatic (석류 seed populate)
      },
      // Custom easing curves. Keys `out`/`in-out` override Tailwind's built-in
      // `ease-out`/`ease-in-out` classes (a key literally named `ease-out`
      // would produce an `ease-ease-out` class). Class contract per 42 §7.
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)', // decelerate — most transitions
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)', // bidirectional
      },
      screens: {
        xs: '380px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px', // wide (40 §2.7) — additive, mobile-first preserved
      },
    },
  },
  plugins: [],
};

export default config;
