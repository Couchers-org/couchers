import glob from 'glob'

let files = glob.sync('**/*.md', { cwd: 'markdown' })
files = files.map(d => d.substr(0, d.lastIndexOf('.')))

export default {
  components: true,
  target: 'static',
  /*
  ** Headers of the page
  */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', type: 'text/css', href: '/css/styles.css' }
    ]
  },
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#643073' },
  /*
  ** Global CSS
  */
  css: [
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    '@nuxt/typescript-build'
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    '@nuxtjs/axios',
    // Doc: https://github.com/nuxt-community/modules/tree/master/packages/bulma
    //'@nuxtjs/bulma'
    '@nuxtjs/gtm'
  ],
  gtm: {
    id: 'GTM-PXP3896'
  },
  axios: {
    retry: { retries: 5 }
  },
  /*
  ** Build configuration
  */
  generate: {
    routes: files
  },
  build: {
    postcss: {
      preset: {
        features: {
          customProperties: false
        }
      }
    },
    /*
    ** You can extend webpack config here
    */
    extend (config, ctx) {
      config.module.rules.push({
        test: /\.md$/,
        loader: 'frontmatter-markdown-loader'
      })
    }
  }
}
