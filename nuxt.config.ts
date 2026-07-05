export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  ssr: true,

  modules: ['@pinia/nuxt'],

  css: [
    '@fontsource-variable/inter',
    '~/assets/styles/main.css',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'motion designer — portfolio',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'immersive webgl portfolio of a motion designer — 3d, animation, direction.' },
        { name: 'theme-color', content: '#0a0a0a' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  runtimeConfig: {
    public: {
      sanityProjectId: process.env.NUXT_PUBLIC_SANITY_PROJECT_ID || '',
      sanityDataset: process.env.NUXT_PUBLIC_SANITY_DATASET || 'production',
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/about'],
    },
  },

  vite: {
    build: {
      target: 'es2020',
    },
  },

  typescript: {
    strict: true,
  },
})
