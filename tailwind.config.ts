import type { Config } from 'tailwindcss';

/**
 * Cohort mobile-first Tailwind config.
 * Brand: deep pomegranate red (Aurora) + soft amber (Vesper), warm ivory ground, off-black text.
 * Mobile-first: base classes target mobile, sm/md/lg/xl progressively enhance.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Core Cohort brand palette
        cohort: {
          primary: '#A8243F', // deep pomegranate red (primary)
          amber: '#E8A33D', // soft amber accent (Vesper highlight)
          ivory: '#F8F4ED', // warm ivory background
          charcoal: '#1A1A1A', // off-black text
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
      },
      screens: {
        xs: '380px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
