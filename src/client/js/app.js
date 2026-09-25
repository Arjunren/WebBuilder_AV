import '../css/styles.css';
import { templates, getTemplate } from '../../shared/templates.js';
import { findNode } from '../../shared/model.js';
import { EditorStore } from './state/store.js';
import { CanvasController } from './editor/canvas.js';
import { groups } from './components/catalog.js';
import { createBlock } from './components/factory.js';
import { LayersPanel } from './panels/layers.js';
import { PropertiesPanel } from './panels/properties.js';
import { api } from './storage/api.js';
import { $, $$, el, toast, showModal, hideModal } from './utils/dom.js';
import { renderSettings } from './ui/settings.js';
import { deploymentGuides } from './ui/deployment.js';
import { registerWebMcpTools } from './webmcp.js';

const store = new EditorStore();
const canvas = new CanvasController(store, $('#canvas'));
const layers = new LayersPanel(store, $('#layers-panel'));
const properties = new PropertiesPanel(store, $('#properties-panel'), uploadAsset);
let previewBlobUrl = null;

function renderBlocks() {
  const panel = $('#blocks-panel');
  panel.replaceChildren();
  for (const group of groups) {
    const title = el('h2', { class: 'block-group-title', text: group.name });
    const grid = el('div', { class: 'block-grid' });
    for (const [type, label, icon] of group.items) {
      const item = el(
        'button',
        {
          class: 'block-item',
          type: 'button',
          draggable: 'true',
          'data-block-type': type,
          title: `Drag ${label} to the canvas`,
        },
        [el('span', { text: icon }), el('span', { text: label })],
      );
      item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', `new:${type}`);
        event.dataTransfer.effectAllowed = 'copy';
      });
      item.addEventListener('click', () => store.add(type, createBlock(type)));
      grid.append(item);
    }
    panel.append(title, grid);
  }
}

function renderTemplates() {
  const grid = $('#template-grid');
  grid.replaceChildren();
  for (const template of templates) {
    const card = el(
      'button',
      { class: 'template-card', type: 'button', 'data-template': template.id },
      [
        el('span', { class: 'template-icon', text: template.id === 'blank' ? '+' : 'P' }),
        el('h3', { text: template.name }),
        el('p', { text: template.description }),
      ],
    );
    card.addEventListener('click', () => startProject(template.id));
    grid.append(card);
  }
}

function startProject(templateId) {
  store.setProject(getTemplate(templateId));
  hideModal('start-screen');
  $('#close-start').classList.remove('hidden');
  toast(templateId === 'blank' ? 'Blank portfolio ready.' : 'Template loaded. Make it yours.');
}

function renderAll() {
  if (!store.project) return;
  canvas.render();
  layers.render();
  properties.render();
  $('#project-name').textContent = store.project.project.name;
  $('#save-label').textContent = store.saved ? 'Saved' : 'Unsaved changes';
  $('#element-count').textContent = `${store.elementCount()} elements`;
  $('#undo-button').disabled = store.history.length === 0;
  $('#redo-button').disabled = store.future.length === 0;
  $('#canvas-shell').dataset.viewport = store.viewport;
  $('#context-toolbar').classList.toggle('hidden', !store.selectedId);
  const selected = store.selected();
  $('#selection-breadcrumb').textContent = selected ? `Page / ${selected.name}` : 'Page';
}

store.addEventListener('project', renderAll);
store.addEventListener('change', renderAll);
store.addEventListener('selection', () => {
  canvas.render();
  layers.render();
  properties.render();
  $('#context-toolbar').classList.toggle('hidden', !store.selectedId);
  const selected = store.selected();
  $('#selection-breadcrumb').textContent = selected ? `Page / ${selected.name}` : 'Page';
});
store.addEventListener('viewport', () => {
  canvas.render();
  properties.render();
  $('#canvas-shell').dataset.viewport = store.viewport;
  $$('.viewport-button').forEach((button) =>
    button.classList.toggle('is-active', button.dataset.viewport === store.viewport),
  );
  const labels = {
    base: 'Responsive desktop',
    tablet: 'Tablet · 768 px',
    mobile: 'Mobile · 375 px',
  };
  $('#viewport-label').textContent = labels[store.viewport];
});
store.addEventListener('saved', renderAll);
store.addEventListener('autosave', () => {
  $('#save-label').textContent = store.saved ? 'Saved' : 'Recovery copy saved';
});

async function saveProject({ quiet = false } = {}) {
  if (!store.project) return false;
  $('#save-label').textContent = 'Saving…';
  try {
    const { project } = await api.saveProject(store.project);
    store.markSaved(project);
    if (!quiet) toast('Project saved on this computer.');
    return true;
  } catch (error) {
    $('#save-label').textContent = 'Save failed';
    toast(error.message, 'error');
    return false;
  }
}

async function uploadAsset(file, nodeId) {
  try {
    const { asset, warning } = await api.uploadAsset(file);
    store.mutate('Upload image', (project) => {
      project.assets ||= [];
      project.assets.push(asset);
      const node = findNode(project.sections, nodeId)?.node;
      if (node) node.content.src = asset.dataUrl;
    });
    toast(warning || 'Image added to the asset library.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function openProjectPicker() {
  try {
    const { projects } = await api.listProjects();
    const list = $('#project-list');
    list.replaceChildren();
    if (!projects.length)
      list.append(
        el('p', {
          class:
            'rounded-xl border border-dashed border-line p-6 text-center text-sm text-slate-500',
          text: 'No saved projects yet.',
        }),
      );
    for (const project of projects) {
      const card = el('button', { class: 'project-card', type: 'button' }, [
        el('span', {}, [
          el('strong', { class: 'block text-white', text: project.name }),
          el('small', {
            class: 'mt-1 block text-xs text-slate-500',
            text: new Date(project.updatedAt).toLocaleString(),
          }),
        ]),
        el('span', { class: 'text-violet-300', text: 'Open →' }),
      ]);
      card.addEventListener('click', async () => {
        try {
          const result = await api.getProject(project.id);
          store.setProject(result.project);
          hideModal('project-picker');
          hideModal('start-screen');
          toast('Project opened.');
        } catch (error) {
          toast(error.message, 'error');
        }
      });
      list.append(card);
    }
    showModal('project-picker');
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function previewProject() {
  try {
    const html = await api.previewProject(store.project);
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    previewBlobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    $('#preview-frame').src = previewBlobUrl;
    $('#preview-new-tab').href = previewBlobUrl;
    $('#preview-modal').classList.remove('hidden');
  } catch (error) {
    toast(error.message, 'error');
  }
}

function renderExportResult(result) {
  const summary = $('#export-summary');
  summary.replaceChildren();
  const size =
    result.size > 1024 * 1024
      ? `${(result.size / 1024 / 1024).toFixed(2)} MB`
      : `${Math.ceil(result.size / 1024)} KB`;
  const details = el('dl', {
    class: 'grid gap-3 rounded-2xl border border-line bg-white/5 p-5 text-sm sm:grid-cols-2',
  });
  for (const [label, value] of [
    ['Project', store.project.project.name],
    ['Export file', result.file],
    ['File size', size],
    ['Exported', new Date(result.exportedAt).toLocaleString()],
  ])
    details.append(
      el('div', {}, [
        el('dt', { class: 'text-slate-500', text: label }),
        el('dd', { class: 'mt-1 break-all font-semibold text-slate-100', text: value }),
      ]),
    );
  const actions = el('div', { class: 'mt-4 flex flex-wrap gap-2' }, [
    el('a', {
      class: 'primary-button',
      href: result.previewUrl,
      target: '_blank',
      rel: 'noopener',
      text: 'Preview export',
    }),
    el('button', {
      class: 'secondary-button',
      type: 'button',
      text: 'Copy file location',
      onclick: () =>
        navigator.clipboard
          .writeText(result.absolutePath)
          .then(() => toast('Export location copied.')),
    }),
    el('button', {
      class: 'secondary-button',
      type: 'button',
      text: 'Export again',
      onclick: exportProject,
    }),
  ]);
  summary.append(details, actions);
}

async function exportProject() {
  if (!(await saveProject({ quiet: true }))) return;
  try {
    const { export: result } = await api.exportProject(store.project);
    renderExportResult(result);
    renderDeploymentOptions();
    showModal('export-modal');
    toast('Standalone index.html created.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

function renderDeploymentOptions() {
  const options = $('#deployment-options');
  options.replaceChildren();
  $('#deployment-instructions').classList.add('hidden');
  for (const [provider, steps] of Object.entries(deploymentGuides)) {
    const button = el('button', { class: 'deployment-choice', type: 'button', text: provider });
    button.addEventListener('click', () => {
      const panel = $('#deployment-instructions');
      panel.replaceChildren(
        el('h4', { text: provider }),
        el(
          'ol',
          {},
          steps.map((step) => el('li', { text: step })),
        ),
      );
      panel.classList.remove('hidden');
    });
    options.append(button);
  }
}

function setupEvents() {
  $('#home-button').addEventListener('click', () => showModal('start-screen'));
  $('#close-start').addEventListener('click', () => hideModal('start-screen'));
  $('#open-project-button').addEventListener('click', openProjectPicker);
  $('#save-button').addEventListener('click', () => saveProject());
  $('#export-button').addEventListener('click', exportProject);
  $('#preview-button').addEventListener('click', previewProject);
  $('#close-preview').addEventListener('click', () => $('#preview-modal').classList.add('hidden'));
  $('#settings-button').addEventListener('click', () => {
    renderSettings(store, $('#settings-form'));
    showModal('settings-modal');
  });
  $('#undo-button').addEventListener('click', () => store.undo());
  $('#redo-button').addEventListener('click', () => store.redo());
  $$('.viewport-button').forEach((button) =>
    button.addEventListener('click', () => {
      store.setViewport(button.dataset.viewport);
    }),
  );
  $$('.panel-tab').forEach((button) =>
    button.addEventListener('click', () => {
      $$('.panel-tab').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      $('#blocks-panel').classList.toggle('hidden', button.dataset.leftTab !== 'blocks');
      $('#layers-panel').classList.toggle('hidden', button.dataset.leftTab !== 'layers');
    }),
  );
  $$('[data-close]').forEach((button) =>
    button.addEventListener('click', () => hideModal(button.dataset.close)),
  );
  $('#context-toolbar').addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'move-up') store.moveSelected(-1);
    if (action === 'move-down') store.moveSelected(1);
    if (action === 'duplicate') store.duplicateSelected();
    if (action === 'delete') showModal('confirm-modal');
  });
  $('#confirm-delete').addEventListener('click', () => {
    store.deleteSelected();
    hideModal('confirm-modal');
    toast('Element deleted. Undo is available.');
  });
  window.addEventListener('keydown', (event) => {
    const editing =
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) ||
      document.activeElement?.isContentEditable;
    const command = event.ctrlKey || event.metaKey;
    if (command && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveProject();
    } else if (command && event.key.toLowerCase() === 'z' && event.shiftKey) {
      event.preventDefault();
      store.redo();
    } else if (command && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      store.undo();
    } else if (command && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      store.redo();
    } else if (command && event.key.toLowerCase() === 'd' && store.selectedId && !editing) {
      event.preventDefault();
      store.duplicateSelected();
    } else if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      store.selectedId &&
      !editing
    ) {
      event.preventDefault();
      showModal('confirm-modal');
    } else if (event.key === 'Escape') {
      store.select(null);
      $$('.modal-backdrop:not(.hidden)').forEach((modal) => {
        if (modal.id !== 'start-screen') modal.classList.add('hidden');
      });
    }
  });
  window.addEventListener('beforeunload', (event) => {
    if (!store.saved) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
}

function init() {
  renderBlocks();
  renderTemplates();
  setupEvents();
  const recovery = store.recovery();
  if (recovery?.project) {
    $('#recover-button').classList.remove('hidden');
    $('#recover-button').addEventListener('click', () => {
      store.setProject(recovery.project);
      store.saved = false;
      hideModal('start-screen');
      toast(`Recovered work from ${new Date(recovery.savedAt).toLocaleString()}.`);
    });
  }
  store.setProject(getTemplate('blank'));
  registerWebMcpTools(store);
}

init();
