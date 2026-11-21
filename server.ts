import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServerApp } from './server/app';

const PORT = Number(process.env.PORT || 3000);
const isBundledServer = import.meta.dirname.endsWith('dist-server');
const isProduction = process.env.NODE_ENV === 'production' || isBundledServer;

async function startServer() {
  const { app, db } = createServerApp();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = isBundledServer
      ? path.resolve(import.meta.dirname, '..', 'dist')
      : path.resolve(import.meta.dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`STAVPARTA server running at http://0.0.0.0:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
