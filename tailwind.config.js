/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '380px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      // `colors` feeds textColor / backgroundColor / borderColor automatically,
      // so nothing extra is needed here for `text-brand-700` to pick up
      // the custom properties.
      //
      // Brand and the dark ink stop wrap their channel triplet in
      // `rgb(... / <alpha-value>)`. That wrapper is what keeps Tailwind's opacity
      // modifiers (`focus:ring-brand-500/20`, `bg-brand-50/60`, 108 of them
      // across the app) compiling — they emit `rgb(var(--brand-50) / 0.6)`, and
      // Tailwind can only produce that from an explicit `<alpha-value>`
      // placeholder. A bare `var(--brand-50, 34 197 108)` silently generates
      // nothing at all, which is what broke the build.
      //
      // The fallback triplet is the original colour, so the theme still renders
      // correctly if `ThemeStyle` is never mounted.
      colors: {
        brand: {
          50: 'rgb(var(--brand-50, 240 253 246) / <alpha-value>)',
          100: 'rgb(var(--brand-100, 220 252 233) / <alpha-value>)',
          200: 'rgb(var(--brand-200, 187 247 211) / <alpha-value>)',
          300: 'rgb(var(--brand-300, 134 239 179) / <alpha-value>)',
          400: 'rgb(var(--brand-400, 74 222 139) / <alpha-value>)',
          500: 'rgb(var(--brand-500, 34 197 108) / <alpha-value>)',
          600: 'rgb(var(--brand-600, 22 163 85) / <alpha-value>)',
          700: 'rgb(var(--brand-700, 21 128 69) / <alpha-value>)',
          800: 'rgb(var(--brand-800, 22 101 57) / <alpha-value>)',
          900: 'rgb(var(--brand-900, 20 83 50) / <alpha-value>)',
          950: 'rgb(var(--brand-950, 5 46 25) / <alpha-value>)',
        },
        bd: {
          green: 'rgb(var(--brand-600, 22 163 85) / <alpha-value>)',
          red: 'rgb(var(--accent-rgb, 244 42 65) / <alpha-value>)',
          gold: '#f4b400',
        },
        // Flat accent colour for sale flags, counters and notification dots.
        // Separate from `brand` because it is a single colour, not a ramp.
  accent: {
    DEFAULT: 'rgb(var(--accent-rgb, 244 42 65) / <alpha-value>)',
    hover: 'rgb(var(--accent-hover-rgb, 216 31 52) / <alpha-value>)',
    on: 'var(--accent-on, #ffffff)',
  },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae3',
          300: '#b0b9c9',
          400: '#8492aa',
          500: '#65748f',
          600: '#505d76',
          700: '#414b60',
          800: '#384151',
          900: 'rgb(var(--ink-900, 31 37 51) / <alpha-value>)',
          950: 'rgb(var(--ink-950, 18 21 31) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px -4px rgba(16,24,40,.08)',
        card: '0 1px 3px rgba(16,24,40,.06), 0 12px 32px -12px rgba(16,24,40,.14)',
        pop: '0 24px 60px -18px rgba(16,24,40,.28)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Track contains two identical copies, so -50% lands exactly one copy over
        // → the second copy sits where the first began and the loop is seamless.
        'marquee-loop': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .4s ease both',
        marquee: 'marquee 32s linear infinite',
        'marquee-loop': 'marquee-loop 22s linear infinite',
      },
    },
  },
  plugins: [],
};
