import { Router } from 'express';
import { z } from 'zod';

const projectSchema = z.object({
  version: z.literal(1),
  project: z.object({
    id: z.string().min(1).max(120),
    name: z.string().min(1).max(120),
    slug: z.string().max(80),
    updatedAt: z.string().optional(),
  }),
  seo: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional(),
  theme: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional(),
  sections: z.array(z.unknown()).max(100),
  assets: z.array(z.unknown()).max(100).optional(),
});

const idSchema = z.string().regex(/^[a-z0-9_-]{1,120}$/i);

export function projectsRouter(service) {
  const router = Router();
  router.get('/', async (_request, response) => response.json({ projects: await service.list() }));
  router.get('/:id', async (request, response) => {
    const id = idSchema.parse(request.params.id);
    response.json({ project: await service.get(id) });
  });
  router.post('/', async (request, response) => {
    const project = projectSchema.parse(request.body);
    response.status(201).json({ project: await service.save(project) });
  });
  router.put('/:id', async (request, response) => {
    idSchema.parse(request.params.id);
    const project = projectSchema.parse(request.body);
    if (project.project.id !== request.params.id)
      return response.status(400).json({ error: 'Project ID mismatch.' });
    return response.json({ project: await service.save(project) });
  });
  router.delete('/:id', async (request, response) => {
    const id = idSchema.parse(request.params.id);
    await service.remove(id);
    response.status(204).end();
  });
  return router;
}
