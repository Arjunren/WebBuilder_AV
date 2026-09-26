import { createBlock } from '../components/factory.js';
import { findNode } from '../../../shared/model.js';
import { renderNode } from './renderer.js';

export class CanvasController {
  constructor(store, element) {
    this.store = store;
    this.element = element;
    this.dragged = null;
    this.bind();
  }

  bind() {
    this.element.addEventListener('click', (event) => {
      const node = event.target.closest('[data-node-id]');
      this.store.select(node?.dataset.nodeId || null);
    });
    this.element.addEventListener('dragstart', (event) => {
      const node = event.target.closest('[data-node-id]');
      if (!node) return;
      this.dragged = `existing:${node.dataset.nodeId}`;
      event.dataTransfer.setData('text/plain', this.dragged);
      event.dataTransfer.effectAllowed = 'move';
      node.classList.add('is-dragging');
    });
    this.element.addEventListener('dragend', () => {
      this.dragged = null;
      this.clearIndicators();
      this.element
        .querySelectorAll('.is-dragging')
        .forEach((node) => node.classList.remove('is-dragging'));
    });
    this.element.addEventListener('dragover', (event) => {
      event.preventDefault();
      this.clearIndicators();
      const target = event.target.closest('[data-node-id]');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const middle =
        event.clientY > rect.top + rect.height * 0.28 &&
        event.clientY < rect.bottom - rect.height * 0.28;
      if (target.dataset.acceptsChildren === 'true' && middle) target.classList.add('drop-inside');
      else target.classList.add('drop-before');
    });
    this.element.addEventListener('drop', (event) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('text/plain') || this.dragged;
      const targetElement = event.target.closest('[data-node-id]');
      let parentId = null;
      let index = null;
      if (targetElement) {
        const target = findNode(this.store.sections(), targetElement.dataset.nodeId);
        if (targetElement.classList.contains('drop-inside')) parentId = target.node.id;
        else {
          parentId = target.parent?.id || null;
          const siblings = target.parent?.children || this.store.sections();
          index = siblings.findIndex((item) => item.id === target.node.id);
        }
      }
      if (data?.startsWith('new:')) {
        const type = data.slice(4);
        this.store.add(type, createBlock(type), parentId, index);
      } else if (data?.startsWith('existing:')) this.store.move(data.slice(9), parentId, index);
      this.clearIndicators();
    });
  }

  clearIndicators() {
    this.element
      .querySelectorAll('.drop-before,.drop-inside')
      .forEach((node) => node.classList.remove('drop-before', 'drop-inside'));
  }

  render() {
    this.element.replaceChildren();
    if (!this.store.sections().length) {
      const empty = document.createElement('div');
      empty.className = 'canvas-empty';
      empty.innerHTML =
        '<strong>Drop your first block here</strong><p>Start with a Hero, About, or Projects section—or build a layout from scratch.</p>';
      this.element.append(empty);
      return;
    }
    const context = {
      viewport: this.store.viewport,
      selectedId: this.store.selectedId,
      onInlineEdit: (id, value) =>
        this.store.updateNode(
          id,
          (node) => {
            node.content.text = value;
          },
          'Edit text',
        ),
    };
    for (const node of this.store.sections()) this.element.append(renderNode(node, context));
  }
}
