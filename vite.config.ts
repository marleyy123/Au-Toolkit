import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

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

let appletConfig: any = {};
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch {
  // fallback if file read error
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), appleEmojiAssets()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || ''),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || ''),
      'import.meta.env.VITE_FIREBASE_DATABASE_ID': JSON.stringify(process.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || '(default)'),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || ''),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID || appletConfig.appId || ''),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || ''),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || ''),
    },
    server: {
      cors: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // The Netlify rewrite/function does not exist in a bare Vite preview.
      // Proxy only during local development so Google Sign-In can complete the
      // same production buyer-verification contract without weakening CORS in
      // the deployed Function.
      proxy: {
        '/api/verify-buyer': {
          target: 'https://autoolkit.netlify.app',
          changeOrigin: true,
          secure: true,
          headers: {
            Origin: 'https://autoolkit.netlify.app',
          },
        },
      },
    },
  };
});
