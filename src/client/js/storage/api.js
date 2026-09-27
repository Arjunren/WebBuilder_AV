import { deviceApi, isDeviceStorageMode } from './device.js';

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers:
      options.body instanceof FormData
        ? options.headers
        : { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    let message = 'The request could not be completed.';
    try {
      message = (await response.json()).error || message;
    } catch {
      /* use generic message */
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

const serverApi = {
  listProjects: () => request('/api/projects'),
  getProject: (id) => request(`/api/projects/${encodeURIComponent(id)}`),
  saveProject: (project) =>
    request(`/api/projects/${encodeURIComponent(project.project.id)}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    }),
  createProject: (project) =>
    request('/api/projects', { method: 'POST', body: JSON.stringify(project) }),
  deleteProject: (id) => request(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  uploadAsset: (file) => {
    const body = new FormData();
    body.append('image', file);
    return request('/api/assets', { method: 'POST', body });
  },
  exportProject: (project) =>
    request('/api/export', { method: 'POST', body: JSON.stringify(project) }),
  previewProject: async (project, pageId) => {
    const response = await fetch('/api/export/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, pageId }),
    });
    if (!response.ok) throw new Error('Preview could not be generated.');
    return response.text();
  },
};

export const api = isDeviceStorageMode() ? deviceApi : serverApi;
export { isDeviceStorageMode, saveTextToDevice } from './device.js';
