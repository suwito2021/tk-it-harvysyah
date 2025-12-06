import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/google-apps-script': {
            target: 'https://script.google.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/google-apps-script/, '/macros/s/AKfycbx0TT0W3YmYFALB9hMBr8CkAe_jr7wtoCf0e_qYg3jxiwXB5mQCRBVe8EKpgeWBYu7J'),
            configure: (proxy, options) => {
              proxy.on('error', (err, req, res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, res) => {
                console.log('Sending Request to Google Apps Script:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                console.log('Received Response from Google Apps Script:', proxyRes.statusCode);
              });
            },
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
