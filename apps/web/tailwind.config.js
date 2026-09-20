/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        chassis: '#090e18',
        'surface-1': '#0e131d',
        'surface-2': '#171c26',
        'surface-3': '#222938',
        'surface-high': '#252a35',
        'border-subdued': '#222d3d',
        'border-active': '#2d3b50',
        'primary-cyan': '#00e5ff',
        'primary-hover': '#33ebff',
        cobalt: '#2563eb',
        azure: '#0ea5e9',
        turquoise: '#00f5c4',
        'status-approved': '#10b981',
        'status-warning': '#f59e0b',
        'status-processing': '#6366f1',
        'status-error': '#ef4444',
        'paper-white': '#ffffff',
        'carbon-ink': '#111827',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        serif: ['STIX Two Text', 'Times New Roman', 'Computer Modern', 'serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 16px rgba(0, 229, 255, 0.15)',
        'cyan-border': '0 0 0 1px #00e5ff, 0 8px 24px rgba(0, 229, 255, 0.08)',
        'paper': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
};
