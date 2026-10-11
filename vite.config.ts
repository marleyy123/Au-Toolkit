import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import { createHandler as createRegionalPricingHandler } from './api/regional-pricing.js';

const appleEmojiAssetDir = path.resolve(
  __dirname,
  'node_modules/emoji-datasource-apple/img/apple/64'
);

const appleEmojiAssets = () => ({
  name: 'au-toolkit-apple-emoji-assets',
  configureServer(server: any) {
    server.middlewares.use('/emoji/apple/64', (request: any, response: any, next: any) => {
      const requestPath = decodeURIComponent((request.url || '').split('?')[0]).replace(/^\/+/, '');
      const filename = path.basename(requestPath);
      if (!filename.endsWith('.png') || filename !== requestPath) return next();

      const assetPath = path.join(appleEmojiAssetDir, filename);
      if (!fs.existsSync(assetPath)) return next();

      response.statusCode = 200;
      response.setHeader('Content-Type', 'image/png');
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      fs.createReadStream(assetPath).pipe(response);
    });
  },
  generateBundle(this: any) {
    if (!fs.existsSync(appleEmojiAssetDir)) {
      this.error('emoji-datasource-apple assets are missing. Run the project dependency install first.');
      return;
    }

    fs.readdirSync(appleEmojiAssetDir)
      .filter((filename) => filename.endsWith('.png'))
      .forEach((filename) => {
        this.emitFile({
          type: 'asset',
          fileName: `emoji/apple/64/${filename}`,
          source: fs.readFileSync(path.join(appleEmojiAssetDir, filename)),
        });
      });
  },
});

const landingPricingPreview = () => ({
  name: 'au-toolkit-local-pricing',
  configureServer(server: any) {
    server.middlewares.use('/api/regional-pricing', (request: any, response: any) => {
      // Bare Vite has no Vercel geo headers; this simulation exists only in dev.
      const handler = createRegionalPricingHandler({ env: {
        VERCEL: '1',
        LYNK_DOMESTIC_CHECKOUT_URL: process.env.LYNK_DOMESTIC_CHECKOUT_URL,
        LYNK_INTERNATIONAL_CHECKOUT_URL: process.env.LYNK_INTERNATIONAL_CHECKOUT_URL,
      } });
      handler({ method: request.method, headers: { 'x-vercel-ip-country': process.env.LANDING_DEV_COUNTRY || 'ID' } }, response);
    });
  },
});

export default defineConfig(() => {
  const verificationOrigin = process.env.VITE_FIREBASE_PROJECT_ID === 'au-toolkit-staging-20261005'
    ? 'https://au-toolkit-testing.vercel.app'
    : 'https://autoolkit.netlify.app';
  return {
    plugins: [react(), tailwindcss(), appleEmojiAssets(), landingPricingPreview()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      cors: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Match the verifier to the frontend Firebase project during local development.
      proxy: {
        '/api/verify-buyer': {
          target: verificationOrigin,
          changeOrigin: true,
          secure: true,
          headers: {
            Origin: verificationOrigin,
          },
        },
      },
    },
  };
});
