import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { ProjectService } from './services/project-service.js';
import { ExportService } from './services/export-service.js';
import { projectsRouter } from './routes/projects.js';
import { exportRouter } from './routes/export.js';
import { assetsRouter } from './routes/assets.js';
import { templates } from '../shared/templates.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '../..');

export function createApp(options = {}) {
  const app = express();
  const projectsDir =
    options.projectsDir || process.env.PROJECTS_DIR || path.join(projectRoot, 'data/projects');
  const exportsDir =
    options.exportsDir || process.env.EXPORTS_DIR || path.join(projectRoot, 'exports');
  const projectService = new ProjectService(projectsDir);
  const exportService = new ExportService(exportsDir);
  const maxImageBytes = Number(process.env.MAX_IMAGE_SIZE_MB || 5) * 1024 * 1024;

  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          frameSrc: ['https://www.youtube.com', 'https://www.youtube-nocookie.com', "'self'"],
          connectSrc: ["'self'", 'ws://127.0.0.1:5173'],
          objectSrc: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'self'", 'https:'],
        },
      },
    }),
  );
  const allowedOrigins = new Set(
    (
      process.env.ALLOWED_ORIGINS ||
      'http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:5173,http://localhost:5173'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
  app.use((request, response, next) => {
    const hostname = request.hostname.replace(/^\[|\]$/g, '');
    if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
      return response.status(403).json({ error: 'Only local requests are accepted.' });
    }
    const origin = request.get('origin');
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
      origin &&
      !allowedOrigins.has(origin)
    ) {
      return response.status(403).json({ error: 'Cross-origin writes are not allowed.' });
    }
    return next();
  });
  app.use(express.json({ limit: process.env.MAX_JSON_SIZE || '2mb', strict: true }));
  app.get('/api/health', (_request, response) => response.json({ ok: true }));
  app.get('/api/templates', (_request, response) =>
    response.json({ templates: templates.map(({ project, ...item }) => ({ ...item, project })) }),
  );
  app.use('/api/projects', projectsRouter(projectService));
  app.use('/api/assets', assetsRouter(maxImageBytes));
  app.use('/api/export', exportRouter(exportService));
  app.use(
    '/exports',
    express.static(exportsDir, { dotfiles: 'deny', index: ['index.html'], fallthrough: false }),
  );

  const dist = path.join(projectRoot, 'dist');
  app.use(express.static(dist, { dotfiles: 'deny' }));
  app.get(/.*/, (_request, response, next) => {
    response.sendFile(path.join(dist, 'index.html'), (error) => error && next());
  });

  app.use((error, _request, response, _next) => {
    void _next;
    const status =
      error instanceof ZodError ? 400 : error.status || (error.code === 'ENOENT' ? 404 : 500);
    const message =
      status >= 500 ? 'The local server could not complete that request.' : error.message;
    if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(error);
    response.status(status).json({ error: message });
  });
  return app;
}
