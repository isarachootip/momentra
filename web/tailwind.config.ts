import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        historical: {
          burgundy: '#881337',
          rose: '#BE123C',
          amber: '#D97706',
          slate: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};

export default config;
