import Vue from "vue"
import Vuetify from "vuetify/lib"

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#f8aa3a',
        secondary: '#b8574c',
        accent: '#9d9891',
      },
    },
  },
})
