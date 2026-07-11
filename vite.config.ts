/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  /** GitHub Pages sirve bajo /dododex-v2/; en dev seguimos en la raíz */
  base: command === 'build' ? '/dododex-v2/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // precachea la app y los datos de especies → funciona 100% offline (lección de Dododex)
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      manifest: {
        name: 'DODODEX V2 — companion de ARK',
        short_name: 'DODODEX V2',
        description:
          'Inspector de stats post-tame, calculadora de tameo y biblioteca de dinos para ARK: Survival Ascended',
        lang: 'es',
        theme_color: '#0c0a07',
        background_color: '#0c0a07',
        display: 'standalone',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
