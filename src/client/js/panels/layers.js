export class LayersPanel {
  constructor(store, element) {
    this.store = store;
    this.element = element;
    this.collapsed = new Set();
  }

  renderNodes(nodes, depth = 0) {
    const fragment = document.createDocumentFragment();
    for (const node of nodes) {
      const row = document.createElement('div');
      row.className = `layer-row${this.store.selectedId === node.id ? ' is-selected' : ''}`;
      row.style.paddingLeft = `${8 + depth * 14}px`;
      if (node.children?.length) {
        const toggle = document.createElement('button');
        toggle.style.flex = '0 0 auto';
        toggle.style.width = '20px';
        toggle.textContent = this.collapsed.has(node.id) ? '›' : '⌄';
        toggle.setAttribute(
          'aria-label',
          `${this.collapsed.has(node.id) ? 'Expand' : 'Collapse'} ${node.name}`,
        );
        toggle.addEventListener('click', (event) => {
          event.stopPropagation();
          this.collapsed.has(node.id)
            ? this.collapsed.delete(node.id)
            : this.collapsed.add(node.id);
          this.render();
        });
        row.append(toggle);
      } else {
        const spacer = document.createElement('span');
        spacer.style.width = '20px';
        row.append(spacer);
      }
      const button = document.createElement('button');
      button.textContent = node.name;
      button.title = node.name;
      button.addEventListener('click', () => this.store.select(node.id));
      row.append(button);
      fragment.append(row);
      if (node.children?.length && !this.collapsed.has(node.id))
        fragment.append(this.renderNodes(node.children, depth + 1));
    }
    return fragment;
  }

  render() {
    this.element.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'mb-3 flex items-center justify-between px-2';
    heading.innerHTML =
      '<span class="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Page structure</span>';
    this.element.append(heading, this.renderNodes(this.store.sections()));
    if (!this.store.sections().length) {
      const empty = document.createElement('p');
      empty.className = 'p-3 text-sm leading-6 text-slate-500';
      empty.textContent = 'Your page layers will appear here as you add blocks.';
      this.element.append(empty);
    }
  }
}
