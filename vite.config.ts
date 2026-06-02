import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isPerizinan = env.VITE_APP_TYPE === 'perizinan';

  const appName = isPerizinan ? 'Portal Izin Santri Nurul Huda' : 'SIMKEU Nurul Huda';
  const appShortName = isPerizinan ? 'Portal Izin Santri NH' : 'SIMKEU NH';
  const appDesc = isPerizinan
    ? 'Portal Administrasi Perizinan Santri Nurul Huda'
    : 'Portal Administrasi Keuangan Yayasan Nurul Huda';
  const appThemeColor = isPerizinan ? '#059669' : '#0f172a'; // Emerald Green vs Slate Dark

  return {
    plugins: [
      react(),
      tailwindcss(),
      basicSsl(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          const title = isPerizinan
            ? 'Portal Izin Nurul Huda | Portal Perizinan Santri'
            : 'SIMKEU NURUL HUDA | Portal Keuangan Pasirwangi';
          const favicon = isPerizinan ? '/pwa-izin-192x192.png' : '/pwa-192x192.png';
          const appleIcon = isPerizinan ? '/pwa-izin-512x512.png' : '/pwa-512x512.png';

          let modifiedHtml = html;
          
          // Replace title
          modifiedHtml = modifiedHtml.replace(
            /<title>.*?<\/title>/i,
            `<title>${title}</title>`
          );
          
          // Replace favicon link
          if (/<link rel="icon"/i.test(modifiedHtml)) {
            modifiedHtml = modifiedHtml.replace(
              /<link rel="icon"[^>]*?>/i,
              `<link rel="icon" type="image/png" href="${favicon}" />`
            );
          } else {
            modifiedHtml = modifiedHtml.replace(
              '</head>',
              `  <link rel="icon" type="image/png" href="${favicon}" />\n  </head>`
            );
          }

          // Replace apple-touch-icon link
          if (/<link rel="apple-touch-icon"/i.test(modifiedHtml)) {
            modifiedHtml = modifiedHtml.replace(
              /<link rel="apple-touch-icon"[^>]*?>/i,
              `<link rel="apple-touch-icon" href="${appleIcon}" />`
            );
          } else {
            modifiedHtml = modifiedHtml.replace(
              '</head>',
              `  <link rel="apple-touch-icon" href="${appleIcon}" />\n  </head>`
            );
          }

          return modifiedHtml;
        }
      },
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true // MENGAKTIFKAN PWA DI MODE DEV UNTUK TESTING
        },
        manifest: {
          id: isPerizinan ? 'portal-perizinan-nh' : 'simkeu-nh',
          name: appName,
          short_name: appShortName,
          description: appDesc,
          theme_color: appThemeColor,
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: isPerizinan ? '/pwa-izin-192x192.png' : '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: isPerizinan ? '/pwa-izin-512x512.png' : '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: isPerizinan ? '/pwa-izin-512x512.png' : '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['lucide-react', 'motion/react'],
            utils: ['xlsx', '@supabase/supabase-js']
          }
        }
      }
    }
  };
});
