import express from 'express';
import { z } from 'zod';
import { configureProxy, apiSecurity, firebaseAdmin } from '../../backend/security';

const app = express();
app.disable('x-powered-by');
configureProxy(app);
app.use(apiSecurity(5));
app.post('*', async (req, res) => {
  if (!z.object({}).strict().safeParse(req.body ?? {}).success) {
    return res.status(400).json({ error: 'Expected an empty request body.' });
  }
  const { uid, auth_time: authenticatedAt } = res.locals.user;
  if (Math.floor(Date.now() / 1000) - authenticatedAt > 300) {
    return res.status(403).json({ error: 'Sign in again before revoking sessions.' });
  }
  try {
    await firebaseAdmin().revokeRefreshTokens(uid);
    return res.sendStatus(204);
  } catch {
    return res.status(503).json({ error: 'Sessions could not be revoked.' });
  }
});
export default app;
