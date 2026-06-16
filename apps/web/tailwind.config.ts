import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#fcf9f8',
        surface: {
          DEFAULT: '#fcf9f8',
          bright: '#fcf9f8',
          dim: '#dcd9d9',
          variant: '#e5e2e1',
          container: {
            DEFAULT: '#f0edec',
            low: '#f6f3f2',
            high: '#ebe7e7',
            highest: '#e5e2e1',
            lowest: '#ffffff',
          },
          tint: '#5d36ef',
        },
        primary: {
          DEFAULT: '#5427e6',
          fixed: {
            DEFAULT: '#e5deff',
            dim: '#c9bfff',
          },
          container: '#6d4aff',
        },
        secondary: {
          DEFAULT: '#613ed3',
          fixed: {
            DEFAULT: '#e7deff',
            dim: '#ccbeff',
          },
          container: '#7b5aed',
        },
        tertiary: {
          DEFAULT: '#5f44a1',
          fixed: {
            DEFAULT: '#e9ddff',
            dim: '#d0bcff',
          },
          container: '#785dbc',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        outline: {
          DEFAULT: '#797588',
          variant: '#c9c4d9',
        },
        inverse: {
          surface: '#313030',
          onSurface: '#f3f0ef',
          primary: '#c9bfff',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.15)',
          active: 'rgba(109, 74, 255, 0.18)',
        },
        'on-glass': {
          primary: 'rgba(255, 255, 255, 0.95)',
          secondary: 'rgba(255, 255, 255, 0.65)',
          muted: 'rgba(255, 255, 255, 0.40)',
        },
        on: {
          background: '#1c1b1b',
          surface: {
            DEFAULT: '#1c1b1b',
            variant: '#484556',
          },
          primary: {
            DEFAULT: '#ffffff',
            container: '#f4eeff',
            fixed: {
              DEFAULT: '#1b0063',
              variant: '#4500d8',
            },
          },
          secondary: {
            DEFAULT: '#ffffff',
            container: '#fffbff',
            fixed: {
              DEFAULT: '#1e0060',
              variant: '#4c20bd',
            },
          },
          tertiary: {
            DEFAULT: '#ffffff',
            container: '#f6eeff',
            fixed: {
              DEFAULT: '#23005c',
              variant: '#503491',
            },
          },
          error: {
            DEFAULT: '#ffffff',
            container: '#93000a',
          },
        },
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
        squircle: '40px',
        'squircle-sm': '16px',
        '24px': '24px',
        '28px': '28px',
      },
      spacing: {
        gutter: '24px',
        unit: '4px',
        'element-gap': '16px',
        'section-gap': '48px',
        'container-padding': '32px',
      },
      fontFamily: {
        geist: ['var(--font-geist)', 'sans-serif'],
        headline: ['var(--font-geist)', 'sans-serif'],
        body: ['var(--font-geist)', 'sans-serif'],
        label: ['var(--font-geist)', 'sans-serif'],
        title: ['var(--font-geist)', 'sans-serif'],
        display: ['var(--font-geist)', 'sans-serif'],
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'title-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      animation: {
        entrance: 'entrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        spin: 'spin 1s linear infinite',
      },
      keyframes: {
        entrance: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
