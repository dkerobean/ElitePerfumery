import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import '../styles.css';
import './shop.css';
import { Shop } from './Shop';
import '../fonts.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <Shop />
  </StrictMode>
);
// Production pages arrive pre-rendered (scripts/prerender.mjs): hydrate them. Dev pages start empty.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
