import { Router } from 'express';
import { renderExport } from '../../shared/export-renderer.js';

export function exportRouter(service) {
  const router = Router();
  router.post('/', async (request, response) => {
    const result = await service.export(request.body);
    response.status(201).json({ export: result });
  });
  router.post('/preview', (request, response) => {
    const { project, pageId } = request.body;
    response.type('html').send(renderExport(project || request.body, pageId));
  });
  router.get('/:slug/download', (request, response, next) => {
    response.download(service.downloadPath(request.params.slug), 'index.html', (error) => {
      if (error && !response.headersSent) next(error);
    });
  });
  return router;
}
