import https from 'https';
import fs from 'fs';
import path from 'path';
import { createServer as createHttpServer } from 'http';

export function createServer(app: any) {
  // En production, utilisez un serveur HTTP normal
  if (process.env.NODE_ENV !== 'production') {
    return createHttpServer(app);
  }

  // En développement, utilisez HTTPS avec des certificats auto-signés
  const devOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'cert', 'localhost-key.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), 'cert', 'localhost.pem')),
  };
  return https.createServer(devOptions, app);
} 