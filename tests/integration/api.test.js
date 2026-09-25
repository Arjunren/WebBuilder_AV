import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/server/app.js';
import { createComponent, createProject } from '../../src/shared/model.js';

let root;
let app;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-builder-'));
  app = createApp({
    projectsDir: path.join(root, 'projects'),
    exportsDir: path.join(root, 'exports'),
  });
});

afterEach(async () => fs.rm(root, { recursive: true, force: true }));

describe('project and export API', () => {
  it('creates, lists, reopens, and exports a project', async () => {
    const project = createProject('Integration Portfolio');
    const heading = createComponent('heading');
    heading.content.text = 'Expected content';
    project.sections.push(heading);
    await request(app).post('/api/projects').send(project).expect(201);
    const list = await request(app).get('/api/projects').expect(200);
    expect(list.body.projects).toHaveLength(1);
    const reopened = await request(app).get(`/api/projects/${project.project.id}`).expect(200);
    expect(reopened.body.project.project.name).toBe('Integration Portfolio');
    const exported = await request(app).post('/api/export').send(project).expect(201);
    const html = await fs.readFile(exported.body.export.absolutePath, 'utf8');
    expect(html).toContain('Expected content');
    expect(html).not.toContain('editor-node');
  });

  it('rejects path traversal and malformed projects', async () => {
    await request(app).get('/api/projects/..%2F..%2Fsecret').expect(400);
    await request(app).post('/api/projects').send({ version: 1 }).expect(400);
  });

  it('rejects non-local hosts and cross-origin writes', async () => {
    await request(app).get('/api/health').set('Host', 'attacker.example').expect(403);
    await request(app)
      .post('/api/projects')
      .set('Origin', 'https://attacker.example')
      .send(createProject('Cross-site attempt'))
      .expect(403);
  });

  it('accepts a real PNG signature and rejects unsafe files', async () => {
    const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(20)]);
    const good = await request(app)
      .post('/api/assets')
      .attach('image', png, { filename: 'sample.png', contentType: 'image/png' })
      .expect(201);
    expect(good.body.asset.dataUrl).toMatch(/^data:image\/png;base64,/);
    await request(app)
      .post('/api/assets')
      .attach('image', Buffer.from('<svg><script/></svg>'), {
        filename: 'attack.svg',
        contentType: 'image/svg+xml',
      })
      .expect(415);
  });
});
