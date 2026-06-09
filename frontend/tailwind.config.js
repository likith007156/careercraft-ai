/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--color-bg-default)',
          card: 'var(--color-bg-card)',
          cardHover: 'var(--color-bg-card-hover)',
          sidebar: 'var(--color-bg-sidebar)'
        },
        primary: {
          DEFAULT: 'var(--color-primary-default)',
          hover: 'var(--color-primary-hover)'
        },
        secondary: {
          DEFAULT: 'var(--color-secondary-default)',
          hover: 'var(--color-secondary-hover)'
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)'
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)'
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          bg: 'var(--color-danger-bg)'
        },
        gold: 'var(--color-gold)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)'
        },
        ink: 'var(--color-ink)',
        pureWhite: 'var(--color-pure-white)',
        fog: 'var(--color-fog)',
        ash: 'var(--color-ash)',
        graphite: 'var(--color-graphite)',
        dove: 'var(--color-dove)',
        rust: 'var(--color-rust)',
        apricotWash: 'var(--color-apricot-wash)',
        skyWash: 'var(--color-sky-wash)'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Source Serif 4', 'Source Serif Pro', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        button: 'var(--radius-button)',
        input: 'var(--radius-input)',
        image: 'var(--radius-image)',
        badge: 'var(--radius-badge)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      backgroundImage: {
        'gradient-premium': 'var(--gradient-premium)',
        'gradient-dark': 'linear-gradient(180deg, #121225 0%, #0c0c14 100%)'
      }
    },
  },
  plugins: [],
}
