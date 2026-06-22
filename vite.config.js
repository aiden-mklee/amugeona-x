import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '아무거나 금지',
        short_name: '아무거나금지',
        description: 'GPS로 주변 점심을 한 곳 정해주는 앱',
        lang: 'ko',
        theme_color: '#E8462B',
        background_color: '#FFFDF8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174, // ← 본인이 쓰던 포트로 두세요 (숨터랑 안 겹치는 번호)
    host: true,
  },
});
