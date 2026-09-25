import { resolveStyles } from '../../../shared/model.js';

const contentFields = {
  heading: [
    ['text', 'Text', 'textarea'],
    ['level', 'Heading level', 'heading'],
  ],
  text: [['text', 'Text', 'textarea']],
  richText: [['text', 'Rich text (use **bold** and *italics*)', 'textarea']],
  quote: [
    ['text', 'Quote', 'textarea'],
    ['author', 'Attribution', 'text'],
  ],
  list: [['text', 'Items (one per line)', 'textarea']],
  button: [
    ['text', 'Label', 'text'],
    ['url', 'Link', 'url'],
    ['newTab', 'Open in new tab', 'checkbox'],
  ],
  link: [
    ['text', 'Label', 'text'],
    ['url', 'Link', 'url'],
    ['newTab', 'Open in new tab', 'checkbox'],
  ],
  image: [
    ['src', 'Image URL or embedded image', 'url'],
    ['alt', 'Alternative text', 'text'],
  ],
  video: [
    ['url', 'Embed URL', 'url'],
    ['title', 'Accessible title', 'text'],
  ],
  icon: [['text', 'Icon / symbol', 'text']],
  navbar: [
    ['brand', 'Brand name', 'text'],
    ['links', 'Links (Label|URL)', 'textarea'],
  ],
  social: [['links', 'Links (Label|URL)', 'textarea']],
  contactForm: [
    ['endpoint', 'External form endpoint', 'url'],
    ['submitLabel', 'Button label', 'text'],
  ],
};

const styleSections = [
  [
    'Typography',
    [
      ['fontFamily', 'Font family', 'text'],
      ['fontSize', 'Size', 'number'],
      ['fontWeight', 'Weight', 'weight'],
      ['lineHeight', 'Line height', 'numberstep'],
      ['letterSpacing', 'Letter spacing', 'number'],
      ['textAlign', 'Alignment', 'align'],
      ['textTransform', 'Transform', 'transform'],
      ['color', 'Text color', 'color'],
    ],
  ],
  [
    'Spacing',
    [
      ['marginTop', 'Margin top', 'number'],
      ['marginRight', 'Margin right', 'number'],
      ['marginBottom', 'Margin bottom', 'number'],
      ['marginLeft', 'Margin left', 'number'],
      ['paddingTop', 'Padding top', 'number'],
      ['paddingRight', 'Padding right', 'number'],
      ['paddingBottom', 'Padding bottom', 'number'],
      ['paddingLeft', 'Padding left', 'number'],
      ['gap', 'Gap', 'number'],
    ],
  ],
  [
    'Layout & size',
    [
      ['width', 'Width (%)', 'number'],
      ['maxWidth', 'Max width', 'number'],
      ['minHeight', 'Min height', 'number'],
      ['height', 'Height', 'number'],
      ['columns', 'Columns', 'number'],
      ['display', 'Visibility', 'display'],
    ],
  ],
  [
    'Appearance',
    [
      ['backgroundColor', 'Background', 'color'],
      ['backgroundImage', 'Background image (url(...))', 'text'],
      ['backgroundPosition', 'Background position', 'backgroundPosition'],
      ['backgroundSize', 'Background size', 'backgroundSize'],
      ['borderColor', 'Border color', 'color'],
      ['borderWidth', 'Border width', 'number'],
      ['borderStyle', 'Border style', 'border'],
      ['borderRadius', 'Corner radius', 'number'],
      ['boxShadow', 'Shadow', 'shadow'],
      ['opacity', 'Opacity', 'numberstep'],
      ['hoverBackgroundColor', 'Hover background', 'color'],
      ['transition', 'Transition', 'transition'],
    ],
  ],
];

function makeInput(type, value) {
  if (type === 'textarea') {
    const input = document.createElement('textarea');
    input.rows = 4;
    input.value = value || '';
    return input;
  }
  if (type === 'checkbox') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(value);
    input.style.width = 'auto';
    return input;
  }
  const selects = {
    heading: [
      ['h1', 'H1'],
      ['h2', 'H2'],
      ['h3', 'H3'],
      ['h4', 'H4'],
      ['h5', 'H5'],
      ['h6', 'H6'],
    ],
    weight: [
      ['400', 'Regular'],
      ['500', 'Medium'],
      ['600', 'Semibold'],
      ['700', 'Bold'],
      ['800', 'Extra bold'],
    ],
    align: [
      ['', 'Inherit'],
      ['left', 'Left'],
      ['center', 'Center'],
      ['right', 'Right'],
    ],
    transform: [
      ['', 'None'],
      ['uppercase', 'Uppercase'],
      ['lowercase', 'Lowercase'],
      ['capitalize', 'Capitalize'],
    ],
    display: [
      ['', 'Visible / inherit'],
      ['none', 'Hidden'],
    ],
    border: [
      ['', 'None / inherit'],
      ['solid', 'Solid'],
      ['dashed', 'Dashed'],
      ['dotted', 'Dotted'],
    ],
    shadow: [
      ['', 'None'],
      ['0 10px 30px rgba(15,23,42,.12)', 'Soft'],
      ['0 20px 50px rgba(15,23,42,.2)', 'Deep'],
    ],
    backgroundPosition: [
      ['', 'Inherit'],
      ['center', 'Center'],
      ['top', 'Top'],
      ['bottom', 'Bottom'],
      ['left', 'Left'],
      ['right', 'Right'],
    ],
    backgroundSize: [
      ['', 'Inherit'],
      ['cover', 'Cover'],
      ['contain', 'Contain'],
      ['auto', 'Original'],
    ],
    transition: [
      ['', 'None / inherit'],
      ['all .2s ease', 'Smooth'],
      ['all .35s ease', 'Gentle'],
    ],
  };
  if (selects[type]) {
    const select = document.createElement('select');
    for (const [optionValue, label] of selects[type]) {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = label;
      option.selected = String(value || '') === optionValue;
      select.append(option);
    }
    return select;
  }
  const input = document.createElement('input');
  input.type = ['color', 'number', 'url'].includes(type) ? type : 'text';
  input.value = type === 'color' ? value || '#000000' : (value ?? '');
  if (type === 'numberstep') {
    input.type = 'number';
    input.step = '.1';
  }
  return input;
}

function field(labelText, input) {
  const wrapper = document.createElement('label');
  wrapper.className = 'field';
  const label = document.createElement('span');
  label.textContent = labelText;
  wrapper.append(label, input);
  return wrapper;
}

export class PropertiesPanel {
  constructor(store, element, uploadAsset) {
    this.store = store;
    this.element = element;
    this.uploadAsset = uploadAsset;
  }

  contentSection(node) {
    const definitions = contentFields[node.type] || [];
    if (!definitions.length && node.type !== 'section') return null;
    const section = document.createElement('section');
    section.className = 'property-section';
    section.innerHTML = '<h3>Content</h3>';
    if (node.type === 'section') definitions.push(['anchorId', 'HTML anchor ID', 'text']);
    for (const [key, label, type] of definitions) {
      const input = makeInput(type, node.content?.[key]);
      input.addEventListener('change', () =>
        this.store.updateNode(
          node.id,
          (target) => {
            target.content ||= {};
            target.content[key] = type === 'checkbox' ? input.checked : input.value;
          },
          `Edit ${label.toLowerCase()}`,
        ),
      );
      section.append(field(label, input));
    }
    if (node.type === 'image') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp';
      input.addEventListener('change', async () => {
        if (input.files[0]) await this.uploadAsset(input.files[0], node.id);
      });
      section.append(field('Upload from this computer', input));
      const assets = this.store.project.assets || [];
      if (assets.length) {
        const select = document.createElement('select');
        select.append(new Option('Choose a previous upload', ''));
        for (const asset of assets)
          select.append(
            new Option(`${asset.name} (${Math.round(asset.size / 1024)} KB)`, asset.id),
          );
        select.addEventListener('change', () => {
          const asset = assets.find((item) => item.id === select.value);
          if (asset)
            this.store.updateNode(
              node.id,
              (target) => {
                target.content.src = asset.dataUrl;
              },
              'Replace image',
            );
        });
        section.append(field('Asset library', select));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'secondary-button w-full';
        remove.textContent = 'Remove selected asset';
        remove.addEventListener('click', () => {
          if (!select.value) return;
          this.store.mutate('Remove asset', (project) => {
            project.assets = (project.assets || []).filter((asset) => asset.id !== select.value);
          });
        });
        section.append(remove);
      }
    }
    return section;
  }

  render() {
    const node = this.store.selected();
    this.element.replaceChildren();
    if (!node) {
      const empty = document.createElement('div');
      empty.className = 'p-6 text-center';
      empty.innerHTML =
        '<div class="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-xl text-slate-500">◇</div><h2 class="font-semibold text-white">Nothing selected</h2><p class="mt-2 text-sm leading-6 text-slate-500">Select an element on the canvas or in Layers to edit its content and design.</p>';
      this.element.append(empty);
      return;
    }
    const header = document.createElement('div');
    header.className = 'property-header';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = node.type;
    const nameInput = document.createElement('input');
    nameInput.className =
      'w-full border-0 bg-transparent p-0 text-lg font-semibold text-white outline-none';
    nameInput.value = node.name;
    nameInput.setAttribute('aria-label', 'Layer name');
    nameInput.addEventListener('change', () =>
      this.store.updateNode(
        node.id,
        (target) => {
          target.name = nameInput.value.trim() || target.name;
        },
        'Rename element',
      ),
    );
    header.append(eyebrow, nameInput);
    this.element.append(header);
    const content = this.contentSection(node);
    if (content) this.element.append(content);
    const resolved = resolveStyles(node.styles, this.store.viewport);
    for (const [title, definitions] of styleSections) {
      const section = document.createElement('section');
      section.className = 'property-section';
      const heading = document.createElement('h3');
      heading.textContent = title;
      section.append(heading);
      if (title === 'Typography' && this.store.viewport !== 'base') {
        const note = document.createElement('p');
        note.className = 'responsive-note';
        note.textContent = `Editing the ${this.store.viewport} override. Blank values inherit from larger screens.`;
        section.append(note);
      }
      const grid = document.createElement('div');
      grid.className = title === 'Spacing' ? 'field-row' : '';
      for (const [key, label, type] of definitions) {
        const currentOverride = node.styles?.[this.store.viewport]?.[key];
        const input = makeInput(type, currentOverride ?? resolved[key] ?? '');
        if (this.store.viewport !== 'base' && currentOverride == null)
          input.dataset.inherited = 'true';
        input.addEventListener('change', () =>
          this.store.updateNode(
            node.id,
            (target) => {
              target.styles ||= {};
              target.styles[this.store.viewport] ||= {};
              const value = input.value;
              if (this.store.viewport !== 'base' && value === '')
                delete target.styles[this.store.viewport][key];
              else target.styles[this.store.viewport][key] = value;
            },
            `Change ${label.toLowerCase()}`,
          ),
        );
        grid.append(field(label, input));
      }
      section.append(grid);
      this.element.append(section);
    }
  }
}
