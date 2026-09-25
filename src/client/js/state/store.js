import {
  findNode,
  insertNode,
  moveNode,
  removeNode,
  cloneNode,
  walkNodes,
} from '../../../shared/model.js';

const AUTOSAVE_KEY = 'local-portfolio-builder:autosave:v1';

export class EditorStore extends EventTarget {
  constructor() {
    super();
    this.project = null;
    this.selectedId = null;
    this.viewport = 'base';
    this.history = [];
    this.future = [];
    this.maxHistory = 60;
    this.saved = true;
    this.autosaveTimer = null;
  }

  setProject(project, { resetHistory = true } = {}) {
    this.project = structuredClone(project);
    this.selectedId = null;
    this.saved = true;
    if (resetHistory) {
      this.history = [];
      this.future = [];
    }
    this.emit('project');
  }

  snapshot() {
    return JSON.stringify({ project: this.project, selectedId: this.selectedId });
  }

  restore(snapshot) {
    const state = JSON.parse(snapshot);
    this.project = state.project;
    this.selectedId = state.selectedId;
    this.saved = false;
    this.queueAutosave();
    this.emit('change');
  }

  mutate(label, callback, { history = true } = {}) {
    if (!this.project) return;
    const before = this.snapshot();
    callback(this.project);
    if (before === this.snapshot()) return;
    if (history) {
      this.history.push({ label, snapshot: before });
      if (this.history.length > this.maxHistory) this.history.shift();
      this.future = [];
    }
    this.project.project.updatedAt = new Date().toISOString();
    this.saved = false;
    this.queueAutosave();
    this.emit('change', { label });
  }

  add(type, component, parentId = null, index = null) {
    this.mutate(`Add ${type}`, (project) => {
      insertNode(project.sections, component, parentId, index);
      this.selectedId = component.id;
    });
  }

  deleteSelected() {
    if (!this.selectedId) return;
    this.mutate('Delete element', (project) => {
      removeNode(project.sections, this.selectedId);
      this.selectedId = null;
    });
  }

  duplicateSelected() {
    const found = findNode(this.project.sections, this.selectedId);
    if (!found) return;
    const siblings = found.parent?.children || this.project.sections;
    const index = siblings.findIndex((item) => item.id === found.node.id);
    const clone = cloneNode(found.node);
    this.mutate('Duplicate element', () => {
      siblings.splice(index + 1, 0, clone);
      this.selectedId = clone.id;
    });
  }

  moveSelected(offset) {
    const found = findNode(this.project.sections, this.selectedId);
    if (!found) return;
    const siblings = found.parent?.children || this.project.sections;
    const index = siblings.findIndex((item) => item.id === found.node.id);
    const next = Math.max(0, Math.min(siblings.length - 1, index + offset));
    if (next === index) return;
    this.mutate('Reorder element', () => {
      siblings.splice(index, 1);
      siblings.splice(next, 0, found.node);
    });
  }

  move(id, parentId, index) {
    this.mutate('Move element', (project) => moveNode(project.sections, id, parentId, index));
  }

  updateNode(id, updater, label = 'Update element') {
    this.mutate(label, (project) => {
      const node = findNode(project.sections, id)?.node;
      if (node) updater(node);
    });
  }

  select(id) {
    this.selectedId = id;
    this.emit('selection');
  }
  setViewport(viewport) {
    this.viewport = viewport;
    this.emit('viewport');
  }
  selected() {
    return this.project ? findNode(this.project.sections, this.selectedId)?.node || null : null;
  }

  undo() {
    const item = this.history.pop();
    if (!item) return;
    this.future.push({ label: item.label, snapshot: this.snapshot() });
    this.restore(item.snapshot);
  }

  redo() {
    const item = this.future.pop();
    if (!item) return;
    this.history.push({ label: item.label, snapshot: this.snapshot() });
    this.restore(item.snapshot);
  }

  markSaved(project = null) {
    if (project) this.project = structuredClone(project);
    this.saved = true;
    localStorage.removeItem(AUTOSAVE_KEY);
    this.emit('saved');
  }

  queueAutosave() {
    clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({ project: this.project, savedAt: new Date().toISOString() }),
      );
      this.emit('autosave');
    }, 450);
  }

  recovery() {
    try {
      return JSON.parse(localStorage.getItem(AUTOSAVE_KEY));
    } catch {
      return null;
    }
  }

  elementCount() {
    let count = 0;
    if (this.project)
      walkNodes(this.project.sections, () => {
        count += 1;
      });
    return count;
  }

  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
