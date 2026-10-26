import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { Readable } from 'node:stream';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const apiUrl = process.env['API_URL'] ?? 'http://localhost:3000';

const app = express();
// Dominios que el SSR acepta en la cabecera Host (protección contra SSRF).
const allowedHosts = (process.env['ALLOWED_HOSTS'] ?? 'localhost').split(',').map((h) => h.trim());
const angularApp = new AngularNodeAppEngine({ allowedHosts });

/**
 * /api va a NestJS. Así web y API comparten dominio: la cookie del admin
 * funciona sin CORS, y el SSR pide datos con URLs relativas.
 */
app.use('/api', async (req, res, next) => {
  try {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string' && !['host', 'connection', 'content-length'].includes(k)) headers.set(k, v);
    }
    headers.set('x-forwarded-for', req.ip ?? '');
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const upstream = await fetch(`${apiUrl}${req.originalUrl}`, {
      method: req.method,
      headers,
      body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
      duplex: hasBody ? 'half' : undefined,
      redirect: 'manual',
    } as RequestInit);
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) res.setHeader(key, value);
    });
    const cookies = upstream.headers.getSetCookie?.();
    if (cookies?.length) res.setHeader('set-cookie', cookies);
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    next(err);
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Web en http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
