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
        // el chunk lazy de wiki-maps pesa ~4.2MB: si supera el límite, el plugin
        // FALLA al generar sw.js y las actualizaciones se quedan atascadas
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // el SW nuevo toma el control YA: un F5 basta para ver la última versión
        // (sin esto quedaba "waiting" hasta cerrar todas las pestañas — quejas de updates lentos)
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'ArkMaster — expediente de campo ARK',
        short_name: 'ArkMaster',
        description:
          'Expediente de campo para ARK Survival Ascended: tameos, recursos, recetas y análisis de laboratorio post-tame',
        lang: 'es',
        theme_color: '#f4edda',
        background_color: '#f4edda',
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
