module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6B1F2B',
        'primary-dark': '#4A151E',
        secondary: '#FFF9ED',
        accent: '#FFF9ED',
        cream: '#FFF9ED',
        maroon: '#6B1F2B',
        'maroon-dark': '#4A151E',
        mustard: '#D4A72C',
        'mustard-dark': '#B8922A',
        'mustard-maroon': '#5C3A2E',
        charcoal: '#292929',
        'charcoal-light': '#5c5c5c',
        'hero-gold': '#F9E79F',
      },
      spacing: {
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '2.5rem',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
