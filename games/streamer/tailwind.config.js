/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Tetris piece colors - prevent purging
    'bg-cyan-400',
    'bg-yellow-400', 
    'bg-purple-400',
    'bg-green-400',
    'bg-red-400',
    'bg-blue-400',
    'bg-orange-400',
    // Also include borders for these colors
    'border-cyan-400',
    'border-yellow-400',
    'border-purple-400', 
    'border-green-400',
    'border-red-400',
    'border-blue-400',
    'border-orange-400',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors for the Tetris theme
        tetris: {
          cyan: '#00f5ff',
          yellow: '#ffff00',
          purple: '#a020f0',
          green: '#00ff00',
          red: '#ff0000',
          blue: '#0000ff',
          orange: '#ffa500',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      fontFamily: {
        'mono': ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      gridTemplateColumns: {
        'tetris': 'repeat(10, minmax(0, 1fr))',
      },
      gridTemplateRows: {
        'tetris': 'repeat(20, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
}