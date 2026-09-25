import { CONTAINER_TYPES, isSafeUrl, resolveStyles } from '../../../shared/model.js';

const pixelProperties = new Set([
  'fontSize',
  'letterSpacing',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'gap',
  'maxWidth',
  'minHeight',
  'height',
  'borderWidth',
  'borderRadius',
]);
const styleMap = {
  backgroundColor: 'backgroundColor',
  color: 'color',
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  lineHeight: 'lineHeight',
  letterSpacing: 'letterSpacing',
  textAlign: 'textAlign',
  textTransform: 'textTransform',
  marginTop: 'marginTop',
  marginRight: 'marginRight',
  marginBottom: 'marginBottom',
  marginLeft: 'marginLeft',
  paddingTop: 'paddingTop',
  paddingRight: 'paddingRight',
  paddingBottom: 'paddingBottom',
  paddingLeft: 'paddingLeft',
  gap: 'gap',
  width: 'width',
  maxWidth: 'maxWidth',
  minHeight: 'minHeight',
  height: 'height',
  borderWidth: 'borderWidth',
  borderColor: 'borderColor',
  borderStyle: 'borderStyle',
  borderRadius: 'borderRadius',
  opacity: 'opacity',
  boxShadow: 'boxShadow',
  display: 'display',
  backgroundImage: 'backgroundImage',
  backgroundPosition: 'backgroundPosition',
  backgroundSize: 'backgroundSize',
  transition: 'transition',
};

function applyStyles(element, styles, type) {
  for (const [key, value] of Object.entries(styles || {})) {
    if (!styleMap[key] || value === '') continue;
    let clean = String(value).replace(/[;{}<>]/g, '');
    if (pixelProperties.has(key) && /^-?\d+(\.\d+)?$/.test(clean)) clean = `${clean}px`;
    if (key === 'width' && /^\d+(\.\d+)?$/.test(clean) && Number(clean) <= 100) clean = `${clean}%`;
    element.style[styleMap[key]] = clean;
  }
  if (type === 'container') {
    element.style.width = '100%';
    element.style.marginInline = 'auto';
  }
  if (type === 'grid' || type === 'columns') {
    element.style.display = 'grid';
    element.style.gridTemplateColumns = `repeat(${Math.max(1, Number(styles.columns) || 1)}, minmax(0, 1fr))`;
  }
}

function baseElement(tag, node, viewport, selectedId) {
  const element = document.createElement(tag);
  element.className = `editor-node editor-node-${node.type}${selectedId === node.id ? ' is-selected' : ''}`;
  element.dataset.nodeId = node.id;
  element.dataset.nodeType = node.type;
  element.draggable = true;
  const styles = resolveStyles(node.styles, viewport);
  applyStyles(element, styles, node.type);
  if (styles.hoverBackgroundColor) {
    const original = element.style.backgroundColor;
    element.addEventListener('mouseenter', () => {
      element.style.backgroundColor = String(styles.hoverBackgroundColor).replace(/[;{}<>]/g, '');
    });
    element.addEventListener('mouseleave', () => {
      element.style.backgroundColor = original;
    });
  }
  const label = document.createElement('span');
  label.className = 'editor-label';
  label.textContent = node.name;
  element.append(label);
  return element;
}

function editableText(element, node, onInlineEdit) {
  element.title = 'Double-click to edit';
  element.addEventListener('dblclick', (event) => {
    event.stopPropagation();
    element.contentEditable = 'plaintext-only';
    element.draggable = false;
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  });
  element.addEventListener('blur', () => {
    if (element.isContentEditable) {
      element.contentEditable = 'false';
      element.draggable = true;
      const label = element.querySelector(':scope > .editor-label');
      const value = [...element.childNodes]
        .filter((child) => child !== label)
        .map((child) => child.textContent)
        .join('')
        .trim();
      onInlineEdit(node.id, value);
    }
  });
  element.addEventListener('keydown', (event) => {
    if (element.isContentEditable && event.key === 'Escape') element.blur();
  });
}

function appendChildren(element, node, context) {
  for (const child of node.children || []) element.append(renderNode(child, context));
}

function appendFormattedText(element, value) {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let cursor = 0;
  for (const match of String(value || '').matchAll(pattern)) {
    if (match.index > cursor)
      element.append(document.createTextNode(value.slice(cursor, match.index)));
    const strong = match[0].startsWith('**');
    const mark = document.createElement(strong ? 'strong' : 'em');
    mark.textContent = match[0].slice(strong ? 2 : 1, strong ? -2 : -1);
    element.append(mark);
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) element.append(document.createTextNode(value.slice(cursor)));
}

function linkRows(raw = '') {
  return String(raw)
    .split('\n')
    .map((row) => {
      const [label, href = '#'] = row.split('|');
      return { label, href: isSafeUrl(href) ? href : '#' };
    });
}

export function renderNode(node, context) {
  const { viewport, selectedId, onInlineEdit } = context;
  let element;
  switch (node.type) {
    case 'section':
      element = baseElement('section', node, viewport, selectedId);
      appendChildren(element, node, context);
      break;
    case 'container':
    case 'columns':
    case 'grid':
      element = baseElement('div', node, viewport, selectedId);
      appendChildren(element, node, context);
      break;
    case 'spacer':
      element = baseElement('div', node, viewport, selectedId);
      break;
    case 'divider':
      element = baseElement('hr', node, viewport, selectedId);
      break;
    case 'heading': {
      const level = /^h[1-6]$/.test(node.content?.level) ? node.content.level : 'h2';
      element = baseElement(level, node, viewport, selectedId);
      element.append(document.createTextNode(node.content?.text || ''));
      editableText(element, node, onInlineEdit);
      break;
    }
    case 'text': {
      element = baseElement('p', node, viewport, selectedId);
      element.append(document.createTextNode(node.content?.text || ''));
      editableText(element, node, onInlineEdit);
      break;
    }
    case 'richText': {
      element = baseElement('div', node, viewport, selectedId);
      for (const paragraph of String(node.content?.text || '').split(/\n\s*\n/)) {
        const child = document.createElement('p');
        appendFormattedText(child, paragraph);
        child.style.marginBottom = '1em';
        element.append(child);
      }
      break;
    }
    case 'quote': {
      element = baseElement('blockquote', node, viewport, selectedId);
      element.append(document.createTextNode(node.content?.text || ''));
      const cite = document.createElement('cite');
      cite.textContent = node.content?.author || '';
      cite.style.display = 'block';
      cite.style.marginTop = '10px';
      element.append(cite);
      break;
    }
    case 'list': {
      element = baseElement('ul', node, viewport, selectedId);
      for (const item of String(node.content?.text || '').split('\n')) {
        const li = document.createElement('li');
        li.textContent = item;
        element.append(li);
      }
      break;
    }
    case 'button':
    case 'link': {
      element = baseElement('a', node, viewport, selectedId);
      element.textContent = node.content?.text || '';
      element.href = '#';
      element.style.display = 'inline-flex';
      element.style.textDecoration = 'none';
      element.addEventListener('click', (event) => event.preventDefault());
      break;
    }
    case 'image': {
      element = baseElement('img', node, viewport, selectedId);
      element.src = isSafeUrl(node.content?.src, { allowDataImages: true }) ? node.content.src : '';
      element.alt = node.content?.alt || '';
      element.style.maxWidth = '100%';
      break;
    }
    case 'video': {
      element = baseElement('div', node, viewport, selectedId);
      element.style.aspectRatio = '16/9';
      element.style.display = 'grid';
      element.style.placeItems = 'center';
      element.style.background = '#111827';
      element.style.color = 'white';
      const span = document.createElement('span');
      span.textContent = '▶ Video embed';
      element.append(span);
      break;
    }
    case 'icon':
      element = baseElement('span', node, viewport, selectedId);
      element.textContent = node.content?.text || '✦';
      element.style.display = 'inline-block';
      break;
    case 'navbar': {
      element = baseElement('header', node, viewport, selectedId);
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'space-between';
      element.style.paddingInline = '24px';
      const brand = document.createElement('strong');
      brand.textContent = node.content?.brand || 'Brand';
      element.append(brand);
      const nav = document.createElement('nav');
      nav.style.display = 'flex';
      nav.style.gap = '20px';
      for (const row of linkRows(node.content?.links)) {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = row.label;
        link.addEventListener('click', (event) => event.preventDefault());
        nav.append(link);
      }
      if (viewport === 'mobile') {
        nav.style.display = 'none';
        const menu = document.createElement('span');
        menu.textContent = '☰';
        menu.setAttribute('aria-label', 'Mobile menu preview');
        element.append(menu);
      } else element.append(nav);
      break;
    }
    case 'social': {
      element = baseElement('nav', node, viewport, selectedId);
      element.style.display = 'flex';
      for (const row of linkRows(node.content?.links)) {
        const link = document.createElement('a');
        link.textContent = row.label;
        link.href = '#';
        link.addEventListener('click', (event) => event.preventDefault());
        element.append(link);
      }
      break;
    }
    case 'contactForm': {
      element = baseElement('form', node, viewport, selectedId);
      element.style.display = 'grid';
      element.style.gap = '12px';
      for (const [labelText, inputTag] of [
        ['Name', 'input'],
        ['Email', 'input'],
        ['Subject', 'input'],
        ['Message', 'textarea'],
      ]) {
        const label = document.createElement('label');
        label.style.display = 'grid';
        label.style.gap = '5px';
        label.append(document.createTextNode(labelText));
        const input = document.createElement(inputTag);
        input.disabled = true;
        input.style.padding = '10px';
        input.style.border = '1px solid #cbd5e1';
        input.style.borderRadius = '8px';
        label.append(input);
        element.append(label);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = node.content?.submitLabel || 'Send message';
      button.style.cssText =
        'justify-self:start;padding:12px 18px;border:0;border-radius:10px;background:#6d4aff;color:#fff';
      element.append(button);
      break;
    }
    default:
      element = baseElement('div', node, viewport, selectedId);
      element.textContent = node.name;
  }
  if (CONTAINER_TYPES.has(node.type)) element.dataset.acceptsChildren = 'true';
  return element;
}
