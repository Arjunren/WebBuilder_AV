export const BREAKPOINTS = ['base', 'tablet', 'mobile'];
export const CONTAINER_TYPES = new Set(['section', 'container', 'columns', 'grid']);

const componentDefaults = {
  section: {
    name: 'Section',
    content: {},
    styles: { base: { paddingTop: '64', paddingBottom: '64', backgroundColor: '#ffffff' } },
    children: [],
  },
  container: {
    name: 'Container',
    content: {},
    styles: { base: { maxWidth: '1120', paddingLeft: '24', paddingRight: '24' } },
    children: [],
  },
  columns: {
    name: 'Columns',
    content: {},
    styles: { base: { columns: '2', gap: '32' }, mobile: { columns: '1' } },
    children: [],
  },
  grid: {
    name: 'Grid',
    content: {},
    styles: {
      base: { columns: '3', gap: '24' },
      tablet: { columns: '2' },
      mobile: { columns: '1' },
    },
    children: [],
  },
  spacer: { name: 'Spacer', content: {}, styles: { base: { height: '48' } }, children: [] },
  divider: {
    name: 'Divider',
    content: {},
    styles: { base: { borderColor: '#dbe2ea', borderWidth: '1' } },
    children: [],
  },
  heading: {
    name: 'Heading',
    content: { text: 'A clear, memorable heading', level: 'h2' },
    styles: {
      base: { fontSize: '42', fontWeight: '700', lineHeight: '1.1', color: '#111827' },
      mobile: { fontSize: '32' },
    },
    children: [],
  },
  text: {
    name: 'Text',
    content: { text: 'Add your story here. Double-click this text to edit it directly.' },
    styles: { base: { fontSize: '17', lineHeight: '1.7', color: '#475569', maxWidth: '720' } },
    children: [],
  },
  richText: {
    name: 'Rich text',
    content: {
      text: 'Write a longer story with **bold emphasis** and *italic details*.\n\nStart a new paragraph with a blank line.',
    },
    styles: {
      base: { fontSize: '17', lineHeight: '1.7', color: '#475569', maxWidth: '720' },
    },
    children: [],
  },
  quote: {
    name: 'Quote',
    content: { text: 'Design is intelligence made visible.', author: 'Alina Wheeler' },
    styles: { base: { fontSize: '24', color: '#334155', borderColor: '#8b5cf6' } },
    children: [],
  },
  list: {
    name: 'List',
    content: { text: 'Thoughtful design\nAccessible interfaces\nDependable engineering' },
    styles: { base: { fontSize: '16', color: '#334155' } },
    children: [],
  },
  button: {
    name: 'Button',
    content: { text: 'View my work', url: '#projects', newTab: false },
    styles: {
      base: {
        backgroundColor: '#6d4aff',
        color: '#ffffff',
        paddingTop: '12',
        paddingBottom: '12',
        paddingLeft: '22',
        paddingRight: '22',
        borderRadius: '10',
        fontWeight: '600',
      },
    },
    children: [],
  },
  link: {
    name: 'Link',
    content: { text: 'Learn more', url: '#about', newTab: false },
    styles: { base: { color: '#6d4aff', fontWeight: '600' } },
    children: [],
  },
  image: {
    name: 'Image',
    content: {
      src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700"%3E%3Crect fill="%23e8e4ff" width="1200" height="700"/%3E%3Ccircle fill="%238b5cf6" opacity=".18" cx="800" cy="170" r="240"/%3E%3Cpath fill="%236d4aff" opacity=".55" d="M0 560L260 330l190 160 210-250 540 460H0z"/%3E%3Ctext x="52" y="88" fill="%233c2c85" font-family="Arial" font-size="34"%3EYour image%3C/text%3E%3C/svg%3E',
      alt: 'Decorative portfolio placeholder',
    },
    styles: { base: { width: '100', borderRadius: '18' } },
    children: [],
  },
  video: {
    name: 'Video',
    content: { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', title: 'Portfolio video' },
    styles: { base: { borderRadius: '16' } },
    children: [],
  },
  icon: {
    name: 'Icon',
    content: { text: '✦' },
    styles: { base: { fontSize: '36', color: '#6d4aff' } },
    children: [],
  },
  navbar: {
    name: 'Navbar',
    content: { brand: 'Studio', links: 'About|#about\nWork|#projects\nContact|#contact' },
    styles: {
      base: { backgroundColor: '#ffffff', color: '#111827', paddingTop: '20', paddingBottom: '20' },
    },
    children: [],
  },
  social: {
    name: 'Social links',
    content: { links: 'LinkedIn|https://linkedin.com\nGitHub|https://github.com' },
    styles: { base: { color: '#6d4aff', gap: '16' } },
    children: [],
  },
  contactForm: {
    name: 'Contact form',
    content: { endpoint: '', submitLabel: 'Send message' },
    styles: {
      base: {
        backgroundColor: '#f8fafc',
        borderRadius: '18',
        paddingTop: '28',
        paddingBottom: '28',
        paddingLeft: '28',
        paddingRight: '28',
      },
    },
    children: [],
  },
};

export function slugify(value) {
  return (
    String(value || 'untitled')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'untitled'
  );
}

export function createId(prefix = 'component') {
  const id =
    globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${id}`;
}

export function createComponent(type, overrides = {}) {
  const base = componentDefaults[type];
  if (!base) throw new Error(`Unsupported component type: ${type}`);
  return structuredClone({ id: createId(type), type, ...base, ...overrides });
}

export function createProject(name = 'Untitled Portfolio') {
  return {
    version: 1,
    project: {
      id: createId('project'),
      name,
      slug: slugify(name),
      updatedAt: new Date().toISOString(),
    },
    seo: {
      title: name,
      description: '',
      author: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      favicon: '',
    },
    theme: {
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      headingFontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      primaryColor: '#6d4aff',
      secondaryColor: '#32d6a0',
      backgroundColor: '#ffffff',
      textColor: '#1e293b',
      containerWidth: '1120',
      borderRadius: '12',
      buttonStyle: 'rounded',
      spacingScale: '1',
      customCss: '',
    },
    sections: [],
    assets: [],
  };
}

export function walkNodes(nodes, visitor, parent = null) {
  for (const node of nodes) {
    visitor(node, parent);
    if (node.children?.length) walkNodes(node.children, visitor, node);
  }
}

export function findNode(nodes, id) {
  let result = null;
  walkNodes(nodes, (node, parent) => {
    if (node.id === id) result = { node, parent };
  });
  return result;
}

export function removeNode(nodes, id) {
  for (let index = 0; index < nodes.length; index += 1) {
    if (nodes[index].id === id) return nodes.splice(index, 1)[0];
    const removed = removeNode(nodes[index].children || [], id);
    if (removed) return removed;
  }
  return null;
}

export function insertNode(nodes, node, parentId = null, index = null) {
  let target = nodes;
  if (parentId) {
    const parent = findNode(nodes, parentId)?.node;
    if (!parent || !CONTAINER_TYPES.has(parent.type)) return false;
    target = parent.children;
  }
  const safeIndex = index === null ? target.length : Math.max(0, Math.min(index, target.length));
  target.splice(safeIndex, 0, node);
  return true;
}

export function moveNode(nodes, id, parentId, index) {
  const found = findNode(nodes, id);
  if (!found || id === parentId) return false;
  if (parentId && findNode(found.node.children || [], parentId)) return false;
  const node = removeNode(nodes, id);
  if (!node) return false;
  if (!insertNode(nodes, node, parentId, index)) {
    insertNode(nodes, node, found.parent?.id || null);
    return false;
  }
  return true;
}

export function cloneNode(node) {
  const clone = structuredClone(node);
  const refresh = (item) => {
    item.id = createId(item.type);
    item.name = `${item.name} copy`;
    item.children?.forEach(refresh);
  };
  refresh(clone);
  return clone;
}

export function resolveStyles(styles = {}, viewport = 'base') {
  if (viewport === 'base') return { ...(styles.base || {}) };
  if (viewport === 'tablet') return { ...(styles.base || {}), ...(styles.tablet || {}) };
  return { ...(styles.base || {}), ...(styles.tablet || {}), ...(styles.mobile || {}) };
}

export function isSafeUrl(value, { allowDataImages = false, allowHash = true } = {}) {
  if (!value) return true;
  const url = String(value).trim();
  if (allowHash && url.startsWith('#')) return /^#[A-Za-z][\w-]*$/.test(url);
  if (allowDataImages && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(url))
    return true;
  try {
    const parsed = new URL(url, 'https://local.invalid');
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function validateProject(project) {
  const errors = [];
  if (!project || project.version !== 1) errors.push('Unsupported or missing project version.');
  if (!project?.project?.name?.trim()) errors.push('Project name is required.');
  if (!Array.isArray(project?.sections)) errors.push('Project sections must be an array.');
  const ids = new Set();
  const validateNodes = (nodes) => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        errors.push('Every component must be an object.');
        continue;
      }
      if (typeof node.id !== 'string' || !/^[a-z0-9_-]{1,160}$/i.test(node.id)) {
        errors.push('Every component requires a safe ID.');
      }
      if (!componentDefaults[node.type]) errors.push(`Unsupported component: ${node.type}.`);
      if (ids.has(node.id)) errors.push(`Duplicate component ID: ${node.id}.`);
      ids.add(node.id);
      for (const key of ['url', 'endpoint']) {
        if (node.content?.[key] && !isSafeUrl(node.content[key]))
          errors.push(`Unsafe URL in ${node.name}.`);
      }
      if (node.type === 'image' && !isSafeUrl(node.content?.src, { allowDataImages: true }))
        errors.push(`Unsafe image URL in ${node.name}.`);
      if (!Array.isArray(node.children))
        errors.push(`Component ${node.name || node.id} requires a children array.`);
      else validateNodes(node.children);
    }
  };
  if (Array.isArray(project?.sections)) validateNodes(project.sections);
  return { valid: errors.length === 0, errors };
}

export const COMPONENT_DEFAULTS = componentDefaults;
