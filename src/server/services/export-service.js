import fs from 'node:fs/promises';
import path from 'node:path';
import { safeChildPath } from '../utils/path-security.js';
import { slugify } from '../../shared/model.js';
import { renderExport } from './export-renderer.js';

export class ExportService {
  constructor(root) {
    this.root = path.resolve(root);
  }

  async export(project) {
    const slug = slugify(project.project.slug || project.project.name);
    const directory = safeChildPath(this.root, slug);
    await fs.mkdir(directory, { recursive: true });
    const html = renderExport(project);
    const file = path.join(directory, 'index.html');
    await fs.writeFile(file, html, 'utf8');
    const stat = await fs.stat(file);
    return {
      slug,
      file: `exports/${slug}/index.html`,
      absolutePath: file,
      previewUrl: `/exports/${slug}/index.html`,
      size: stat.size,
      exportedAt: stat.mtime.toISOString(),
    };
  }
}
