import { el, toast } from '../utils/dom.js';

export class PagesPanel {
  constructor(store, element) {
    this.store = store;
    this.element = element;
  }

  addPage() {
    const name = window.prompt('Page name', 'New page')?.trim();
    if (!name) return;
    const page = this.store.addPage(name);
    if (page) toast(`${page.name} page added.`);
  }

  renamePage(page) {
    const name = window.prompt('Rename page', page.name)?.trim();
    if (name && name !== page.name) this.store.renamePage(page.id, name);
  }

  render() {
    this.element.replaceChildren(
      el('div', { class: 'mb-3 flex items-center justify-between gap-2 px-1' }, [
        el('div', {}, [
          el('p', {
            class: 'text-xs font-bold uppercase tracking-[.14em] text-slate-500',
            text: 'Website pages',
          }),
          el('p', { class: 'mt-1 text-xs text-slate-500', text: 'Each page has its own canvas.' }),
        ]),
        el('button', {
          class: 'primary-button h-9 px-3',
          type: 'button',
          text: '+ Add',
          onclick: () => this.addPage(),
        }),
      ]),
    );

    for (const page of this.store.project?.pages || []) {
      const active = page.id === this.store.activePageId;
      const select = el(
        'button',
        {
          class: 'min-w-0 flex-1 text-left',
          type: 'button',
          onclick: () => this.store.selectPage(page.id),
        },
        [
          el('strong', { class: 'block truncate text-sm text-slate-100', text: page.name }),
          el('small', {
            class: 'mt-0.5 block truncate text-xs text-slate-500',
            text: page.slug === 'index' ? '/index.html' : `/${page.slug}.html`,
          }),
        ],
      );
      const actions = el('div', { class: 'flex shrink-0 items-center gap-1' }, [
        el('button', {
          class: 'page-action',
          type: 'button',
          title: `Rename ${page.name}`,
          'aria-label': `Rename ${page.name}`,
          text: '✎',
          onclick: () => this.renamePage(page),
        }),
      ]);
      if (page.slug !== 'index') {
        actions.append(
          el('button', {
            class: 'page-action text-rose-300',
            type: 'button',
            title: `Delete ${page.name}`,
            'aria-label': `Delete ${page.name}`,
            text: '×',
            onclick: () => {
              if (window.confirm(`Delete the ${page.name} page?`)) {
                this.store.deletePage(page.id);
                toast('Page deleted. Undo is available.');
              }
            },
          }),
        );
      }
      this.element.append(
        el('div', { class: `page-card${active ? ' is-active' : ''}` }, [select, actions]),
      );
    }
  }
}
