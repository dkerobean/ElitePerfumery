// Injects the pre-rendered HTML into dist/index.html and dist/shop/index.html.
// Runs automatically as the last step of `pnpm build`.
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { render } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url));

// Preload the fonts the first screen uses, so text appears in its real typeface sooner.
const assets = readdirSync(root + 'dist/assets');
const want = [/^manrope-latin-wght-normal-.*\.woff2$/, /^cormorant-garamond-latin-500-normal-.*\.woff2$/, /^cormorant-garamond-latin-600-normal-.*\.woff2$/];
const preloads = want
  .map((re) => assets.find((f) => re.test(f)))
  .filter(Boolean)
  .map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`)
  .join('\n    ');

for (const [file, page] of [
  ['dist/index.html', 'home'],
  ['dist/shop/index.html', 'shop'],
]) {
  const path = root + file;
  const html = readFileSync(path, 'utf8');
  const slot = '<div id="root"></div>';
  if (!html.includes(slot)) throw new Error(`${file}: no empty #root to fill`);
  const body = render(page);
  const out = html.replace(slot, `<div id="root">${body}</div>`).replace('</head>', `  ${preloads}\n  </head>`);
  writeFileSync(path, out);
  console.log(`prerendered ${file} (${(body.length / 1024).toFixed(1)} KB of HTML)`);
}
rmSync(root + 'dist-ssr', { recursive: true, force: true });
