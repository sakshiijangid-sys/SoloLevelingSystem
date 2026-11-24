import express, { type Request, type Response, type NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json';

export const referrerPolicy = 'strict-origin-when-cross-origin';
export const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' https://apis.google.com https://www.gstatic.com https://www.google.com https://www.recaptcha.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io",
  "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://www.google.com https://www.recaptcha.net",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

export function firebaseAdmin() {
  const rawCredential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
  const app = getApps()[0] ?? initializeApp({
    projectId,
    credential: rawCredential ? cert(JSON.parse(rawCredential)) : applicationDefault(),
  });
  return getAuth(app);
}

export function configureProxy(app: ReturnType<typeof express>) {
  const hops = process.env.VERCEL ? '1' : process.env.TRUST_PROXY_HOPS;
  if (hops && /^[1-9]\d*$/.test(hops)) app.set('trust proxy', Number(hops));
}

export function apiSecurity(limit: number) {
  const router = express.Router();
  router.use(helmet({ contentSecurityPolicy: false, crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, referrerPolicy: { policy: referrerPolicy } }));
  router.use((req, res, next) => {
    const origin = req.get('Origin');
    const configured = process.env.APP_URL;
    const allowed = configured && /^https?:\/\//.test(configured)
      ? new URL(configured).origin
      : undefined;
    const sameOrigin = origin === `https://${req.get('host')}` ||
      (process.env.NODE_ENV !== 'production' && origin === `http://${req.get('host')}`);
    if (origin && origin !== allowed && !sameOrigin) {
      return res.status(403).json({ error: 'Origin not allowed.' });
    }
    if (allowed && origin === allowed) {
      res.set('Access-Control-Allow-Origin', allowed);
      res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.vary('Origin');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  router.use(rateLimit({ windowMs: 60_000, limit, standardHeaders: 'draft-7', legacyHeaders: false,
    message: { error: 'Too many requests. Try again in a minute.' },
  }));
  router.use(express.json({ limit: '256kb' }));
  router.use((error: { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = error.status === 413 ? 413 : 400;
    res.status(status).json({ error: status === 413 ? 'Request is too large.' : 'Invalid JSON.' });
  });
  router.use(async (req, res, next) => {
    if (req.body && Buffer.byteLength(JSON.stringify(req.body)) > 256 * 1024) {
      return res.status(413).json({ error: 'Request is too large.' });
    }
    const token = req.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
    try {
      res.locals.user = await firebaseAdmin().verifyIdToken(token, true);
    } catch {
      return res.status(401).json({ error: 'Your session could not be verified.' });
    }
    if (!res.locals.user.email_verified) {
      return res.status(403).json({ error: 'Verify your email to continue.' });
    }
    next();
  });
  return router;
}
