import fs from 'node:fs/promises';
import path from 'node:path';
import { safeChildPath } from '../utils/path-security.js';
import { slugify, validateProject } from '../../shared/model.js';

export class ProjectService {
  constructor(root) {
    this.root = path.resolve(root);
  }

  async init() {
    await fs.mkdir(this.root, { recursive: true });
  }

  async list() {
    await this.init();
    const files = (await fs.readdir(this.root)).filter((name) => name.endsWith('.json'));
    const projects = [];
    for (const file of files) {
      try {
        const raw = await fs.readFile(path.join(this.root, file), 'utf8');
        const document = JSON.parse(raw);
        projects.push({ ...document.project, file: file.replace(/\.json$/, '') });
      } catch {
        // Corrupt files are isolated and omitted from the project picker.
      }
    }
    return projects.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  async get(id) {
    const file = safeChildPath(this.root, id, '.json');
    return JSON.parse(await fs.readFile(file, 'utf8'));
  }

  async save(project) {
    const result = validateProject(project);
    if (!result.valid) {
      const error = new Error(result.errors.join(' '));
      error.status = 400;
      throw error;
    }
    const clean = structuredClone(project);
    clean.project.slug = slugify(clean.project.slug || clean.project.name);
    clean.project.updatedAt = new Date().toISOString();
    const file = safeChildPath(this.root, clean.project.id || clean.project.slug, '.json');
    await this.init();
    const temporary = `${file}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(clean, null, 2), { encoding: 'utf8', flag: 'w' });
    await fs.rename(temporary, file);
    return clean;
  }

  async remove(id) {
    const file = safeChildPath(this.root, id, '.json');
    await fs.unlink(file);
  }
}
