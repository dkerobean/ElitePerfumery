import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import './fonts.css';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
// Production pages arrive pre-rendered (scripts/prerender.mjs): hydrate them. Dev pages start empty.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
