import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{astro,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        surface: '#FAF8F5',
        ink: '#2C2C2C',
        muted: '#7A7268',
        accent: '#C4956A',
        sage: '#8B9E82',
        'code-bg': '#F0EDE8',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'Noto Serif SC', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      maxWidth: {
        reading: '720px',
        content: '1200px',
      },
      spacing: {
        section: '160px',
        'section-sm': '120px',
      },
      transitionTimingFunction: {
        natural: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
