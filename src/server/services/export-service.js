import fs from 'node:fs/promises';
import path from 'node:path';
import { safeChildPath } from '../utils/path-security.js';
import { normalizeProject, slugify } from '../../shared/model.js';
import { renderExport } from '../../shared/export-renderer.js';

export class ExportService {
  constructor(root) {
    this.root = path.resolve(root);
  }

  async export(project) {
    const normalized = normalizeProject(project);
    const slug = slugify(normalized.project.slug || normalized.project.name);
    const directory = safeChildPath(this.root, slug);
    await fs.mkdir(directory, { recursive: true });
    const files = [];
    for (const page of normalized.pages) {
      const filename = page.slug === 'index' ? 'index.html' : `${page.slug}.html`;
      const file = path.join(directory, filename);
      await fs.writeFile(file, renderExport(normalized, page.id), 'utf8');
      const stat = await fs.stat(file);
      files.push({
        pageId: page.id,
        pageName: page.name,
        file: `exports/${slug}/${filename}`,
        previewUrl: `/exports/${slug}/${filename}`,
        size: stat.size,
      });
    }
    const stat = await fs.stat(path.join(directory, 'index.html'));
    return {
      slug,
      file: `exports/${slug}/index.html`,
      absolutePath: path.join(directory, 'index.html'),
      previewUrl: `/exports/${slug}/index.html`,
      downloadUrl: `/api/export/${encodeURIComponent(slug)}/download`,
      size: stat.size,
      exportedAt: stat.mtime.toISOString(),
      files,
    };
  }

  downloadPath(slug) {
    return path.join(safeChildPath(this.root, slug), 'index.html');
  }
}
