import { init } from '@sentry/react';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (import.meta.env.VITE_SENTRY_DSN) {
  init({ dsn: import.meta.env.VITE_SENTRY_DSN });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
