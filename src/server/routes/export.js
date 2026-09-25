import { Router } from 'express';
import { renderExport } from '../services/export-renderer.js';

export function exportRouter(service) {
  const router = Router();
  router.post('/', async (request, response) => {
    const result = await service.export(request.body);
    response.status(201).json({ export: result });
  });
  router.post('/preview', (request, response) => {
    response.type('html').send(renderExport(request.body));
  });
  return router;
}
