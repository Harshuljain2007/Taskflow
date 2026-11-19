import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

function resolveBasePath(): string {
  const explicitBase = process.env.VITE_BASE_PATH?.trim();
  if (explicitBase) {
    const withLeadingSlash = explicitBase.startsWith('/') ? explicitBase : `/${explicitBase}`;
    return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
  }

  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    if (repoName && !repoName.endsWith('.github.io')) {
      return `/${repoName}/`;
    }
  }

  return '/';
}

export default defineConfig(() => {
  return {
    base: resolveBasePath(),
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds, and prepares SPA fallback files for GitHub Pages.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }

          const indexHtml = path.join(distDir, 'index.html');
          const fallback404 = path.join(distDir, '404.html');
          const noJekyll = path.join(distDir, '.nojekyll');
          if (fs.existsSync(indexHtml)) {
            fs.copyFileSync(indexHtml, fallback404);
            fs.writeFileSync(noJekyll, '');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
