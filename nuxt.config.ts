// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from './package.json'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/i18n', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  // Nitro's built-in WebSocket powers the live score push to every board.
  nitro: {
    experimental: { websocket: true },
  },

  runtimeConfig: {
    // Host area is gated by this PIN. Override in production via NUXT_HOST_PIN.
    // Default 1909 = the tournament date (19.09.) — change it before the event.
    hostPin: '1909',
    public: {
      appName: 'Spielwiese',
      version: pkg.version,
    },
  },

  i18n: {
    defaultLocale: 'de',
    strategy: 'no_prefix',
    locales: [
      { code: 'de', file: 'de.json', name: 'Deutsch' },
      { code: 'en', file: 'en.json', name: 'English' },
    ],
    bundle: { optimizeTranslationDirective: false },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'de' },
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      title: 'Spielwiese',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
      ],
      meta: [
        { name: 'theme-color', content: '#2f9e44' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Spielwiese' },
      ],
    },
  },
})
