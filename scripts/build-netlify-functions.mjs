import { mkdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const sourceDirectory = resolve(root, 'netlify/functions');
const outputDirectory = resolve(root, 'netlify/functions-dist');

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

await build({
  entryPoints: [resolve(sourceDirectory, 'export-render.mjs')],
  outfile: resolve(outputDirectory, 'export-render.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  // Playwright's optional WebDriver-BiDi bridge is not used by this CDP
  // Chromium screenshot path and is not shipped in playwright-core.
  external: [
    'chromium-bidi/lib/cjs/bidiMapper/BidiMapper',
    'chromium-bidi/lib/cjs/cdp/CdpConnection',
  ],
  plugins: [{
    name: 'playwright-serverless-paths',
    setup(buildContext) {
      buildContext.onLoad({ filter: /playwright-core[\\/]lib[\\/]server[\\/]utils[\\/]nodePlatform\.js$/ }, async ({ path }) => ({
        contents: (await readFile(path, 'utf8')).replace(
          'require.resolve("../../../package.json")',
          '(process.cwd() + "/package.json")',
        ),
        loader: 'js',
      }));
    },
  }],
  sourcemap: false,
  // Netlify's ESM bootstrap declares Node compatibility globals. Renaming
  // bundled internals prevents dependency-local `__dirname` declarations
  // from colliding with that bootstrap without altering runtime behavior.
  minifyIdentifiers: true,
  minifySyntax: false,
  minifyWhitespace: false,
});

await build({
  entryPoints: [resolve(sourceDirectory, 'verify-buyer.mjs')],
  outfile: resolve(outputDirectory, 'verify-buyer.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  sourcemap: false,
});
