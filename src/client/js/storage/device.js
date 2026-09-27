import { normalizeProject, slugify, validateProject } from '../../../shared/model.js';
import { renderExport } from '../../../shared/export-renderer.js';

const DATABASE_NAME = 'portfolio-builder-device';
const DATABASE_VERSION = 1;
const PROJECT_STORE = 'projects';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function isTauriApp() {
  return Boolean(window.__TAURI_INTERNALS__);
}

export function isDeviceStorageMode() {
  return isTauriApp() || new URLSearchParams(window.location.search).get('local') === '1';
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PROJECT_STORE))
        database.createObjectStore(PROJECT_STORE, { keyPath: 'project.id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Device storage could not open.'));
  });
}

async function runStore(mode, operation) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(PROJECT_STORE, mode);
      const store = transaction.objectStore(PROJECT_STORE);
      let result;
      try {
        result = operation(store);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(result?.result ?? result);
      transaction.onerror = () =>
        reject(transaction.error || new Error('Device storage operation failed.'));
      transaction.onabort = () =>
        reject(transaction.error || new Error('Device storage operation was cancelled.'));
    });
  } finally {
    database.close();
  }
}

function validatedProject(input) {
  const project = normalizeProject(input);
  const validation = validateProject(project);
  if (!validation.valid) throw new Error(validation.errors.join(' '));
  project.project.slug = slugify(project.project.slug || project.project.name);
  project.project.updatedAt = new Date().toISOString();
  return project;
}

function matchesImageSignature(bytes, type) {
  if (type === 'image/png')
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/webp')
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  return false;
}

function bytesToDataUrl(bytes, type) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize)
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  return `data:${type};base64,${btoa(binary)}`;
}

function makeDownload(html, filename) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  return { filename, html, previewUrl: url, downloadUrl: url, size: new Blob([html]).size };
}

export const deviceApi = {
  async listProjects() {
    const projects = await runStore('readonly', (store) => store.getAll());
    return {
      projects: projects
        .map((project) => project.project)
        .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
    };
  },

  async getProject(id) {
    const project = await runStore('readonly', (store) => store.get(id));
    if (!project) throw new Error('Project not found on this device.');
    return { project: normalizeProject(project) };
  },

  async saveProject(input) {
    const project = validatedProject(input);
    await runStore('readwrite', (store) => store.put(project));
    return { project };
  },

  async createProject(input) {
    return this.saveProject(input);
  },

  async deleteProject(id) {
    await runStore('readwrite', (store) => store.delete(id));
    return null;
  },

  async uploadAsset(file) {
    if (!file) throw new Error('Choose an image first.');
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 5 MB or smaller.');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
      throw new Error('Use a PNG, JPEG, or WebP image.');
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesImageSignature(bytes, file.type))
      throw new Error('The image signature is invalid.');
    return {
      asset: {
        id: `asset_${crypto.randomUUID()}`,
        name: file.name.replace(/[^a-z0-9._-]/gi, '-').slice(0, 120),
        type: file.type,
        size: file.size,
        dataUrl: bytesToDataUrl(bytes, file.type),
      },
      warning: file.size > 1024 * 1024 ? 'Large embedded images increase project size.' : '',
    };
  },

  async exportProject(input) {
    const project = validatedProject(input);
    const slug = project.project.slug;
    const generated = project.pages.map((page) => {
      const filename = page.slug === 'index' ? 'index.html' : `${page.slug}.html`;
      return {
        pageId: page.id,
        pageName: page.name,
        file: filename,
        ...makeDownload(renderExport(project, page.id), filename),
      };
    });
    const entry = generated.find((file) => file.filename === 'index.html') || generated[0];
    return {
      export: {
        slug,
        file: entry.filename,
        absolutePath: isTauriApp() ? 'Choose a location when downloading' : 'Browser downloads',
        previewUrl: entry.previewUrl,
        downloadUrl: entry.downloadUrl,
        size: entry.size,
        exportedAt: new Date().toISOString(),
        files: generated,
        deviceLocal: true,
      },
    };
  },

  async previewProject(project, pageId) {
    return renderExport(project, pageId);
  },
};

export async function saveTextToDevice(filename, contents, extension = 'html') {
  if (isTauriApp()) {
    const [{ save }, { writeTextFile }] = await Promise.all([
      import('@tauri-apps/plugin-dialog'),
      import('@tauri-apps/plugin-fs'),
    ]);
    const destination = await save({
      defaultPath: filename,
      filters: [{ name: `${extension.toUpperCase()} file`, extensions: [extension] }],
    });
    if (!destination) return null;
    await writeTextFile(destination, contents);
    return destination;
  }
  const url = URL.createObjectURL(
    new Blob([contents], {
      type: extension === 'json' ? 'application/json' : 'text/html;charset=utf-8',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}
