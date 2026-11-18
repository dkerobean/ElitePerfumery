/**
 * Build-time pre-rendering (see scripts/prerender.mjs).
 * The pages are rendered to plain HTML once during `pnpm build`, so phones see
 * the full page immediately and React then "hydrates" it instead of drawing it from scratch.
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import { Shop } from './shop/Shop';

export function render(page: 'home' | 'shop') {
  return renderToString(<StrictMode>{page === 'shop' ? <Shop /> : <App />}</StrictMode>);
}
