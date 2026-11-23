import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import helmet from 'helmet';
import chat from './api/chat';
import revokeSessions from './api/auth/revoke-sessions';
import { configureProxy, apiSecurity, contentSecurityPolicy, referrerPolicy } from './backend/security';
import { chatRequest } from './src/lib/chatSchemas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
configureProxy(app);
const production = process.env.NODE_ENV === 'production';
app.use(helmet({
  contentSecurityPolicy: false, crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  strictTransportSecurity: production,
  referrerPolicy: { policy: referrerPolicy },
}));
if (production) {
  app.use((_req, res, next) => {
    res.set('Content-Security-Policy', contentSecurityPolicy);
    next();
  });
}

app.use('/api/auth/revoke-sessions', revokeSessions);
app.use('/api/chat/stream', apiSecurity(15));


const MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

// Streaming endpoint
app.post('/api/chat/stream', async (req: Request, res: Response) => {
  try {
    const currentApiKey = process.env.GEMINI_API_KEY;
    if (!currentApiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY_MISSING' });
    }

    const parsed = chatRequest.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid chat request.' });
    const { message, userName } = parsed.data;
    const ai = new GoogleGenAI({ apiKey: currentApiKey });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let streamStarted = false;
    for (const model of MODELS) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: model,
          contents: message,
          config: {
            systemInstruction: `You are the "Solo Leveling System Oracle", a wise, motivating guide for user "${userName}".`,
          },
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        streamStarted = true;
        break;
      } catch (err: any) {
        console.warn(`Stream model ${model} failed, attempting next:`, err?.message || err);
      }
    }

    if (!streamStarted) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to initiate stream with models.' })}\n\n`);
    } else {
      res.write('data: [DONE]\n\n');
    }
    res.end();
  } catch (error: any) {
    console.error('Server Gemini Stream Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'The stream is temporarily unavailable.' })}\n\n`);
    res.end();
  }
});

app.use('/api/chat', chat);

// Vite middleware in dev or static files in production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
