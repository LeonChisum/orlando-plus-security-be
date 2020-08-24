module.exports = {
  purge: [],
  theme: {
    extend: {},
    colors: {
      primary: "#D4AF37",
    },
    fontFamily: {
      display: ['Dosis', 'sans-serif']
    }
  },
  variants: {},
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
