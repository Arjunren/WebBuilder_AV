import { createComponent, createProject } from './model.js';

function text(type, content, styles = {}) {
  const node = createComponent(type);
  node.content = { ...node.content, ...content };
  node.styles = {
    ...node.styles,
    ...styles,
    base: { ...(node.styles.base || {}), ...(styles.base || {}) },
    tablet: { ...(node.styles.tablet || {}), ...(styles.tablet || {}) },
    mobile: { ...(node.styles.mobile || {}), ...(styles.mobile || {}) },
  };
  return node;
}

function section(name, children, styles = {}) {
  return createComponent('section', {
    name,
    styles: { base: { paddingTop: '88', paddingBottom: '88', ...styles } },
    children: [createComponent('container', { children })],
  });
}

function makeStarter({ name, role, intro, accent = '#6d4aff', projectLabel = 'Selected work' }) {
  const project = createProject(name);
  project.project.name = name;
  project.project.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  project.seo.title = `${name} — ${role}`;
  project.seo.description = intro;
  project.theme.primaryColor = accent;
  const navbar = createComponent('navbar', {
    content: {
      brand: name.split(' ')[0],
      links: 'About|#about\nProjects|#projects\nContact|#contact',
    },
  });
  const hero = section(
    'Hero',
    [
      text('icon', { text: '✦' }, { base: { color: accent, fontSize: '32' } }),
      text(
        'heading',
        { text: `${name}.\n${role}.` },
        {
          base: {
            fontSize: '68',
            fontWeight: '800',
            lineHeight: '1.02',
            color: '#111827',
            maxWidth: '800',
          },
          tablet: { fontSize: '54' },
          mobile: { fontSize: '40' },
        },
      ),
      text(
        'text',
        { text: intro },
        {
          base: {
            fontSize: '20',
            lineHeight: '1.65',
            color: '#526076',
            maxWidth: '680',
            marginTop: '24',
          },
        },
      ),
      text(
        'button',
        { text: 'Explore my work', url: '#projects' },
        {
          base: { backgroundColor: accent, color: '#ffffff', marginTop: '28', borderRadius: '999' },
        },
      ),
    ],
    { backgroundColor: '#f6f7fb' },
  );
  hero.content = { anchorId: 'home' };
  const about = section('About', [
    text(
      'heading',
      { text: 'A little about me' },
      { base: { fontSize: '40', color: '#111827' }, mobile: { fontSize: '32' } },
    ),
    text('text', {
      text: 'I turn complex ideas into useful, human experiences. My process combines curiosity, craft, and close collaboration.',
    }),
  ]);
  about.content = { anchorId: 'about' };
  const cards = createComponent('grid', {
    children: [
      ...['Project North', 'Field Notes', 'Studio System'].map((title, index) =>
        createComponent('container', {
          name: title,
          styles: {
            base: {
              backgroundColor: index === 1 ? '#efeaff' : '#f3f5f8',
              paddingTop: '28',
              paddingBottom: '28',
              paddingLeft: '28',
              paddingRight: '28',
              borderRadius: '18',
            },
          },
          children: [
            text('heading', { text: title }, { base: { fontSize: '24', color: '#111827' } }),
            text(
              'text',
              { text: `${projectLabel} · ${2026 - index}` },
              { base: { fontSize: '15', color: '#64748b', marginTop: '10' } },
            ),
          ],
        }),
      ),
    ],
  });
  const projects = section(
    'Projects',
    [
      text(
        'heading',
        { text: projectLabel },
        { base: { fontSize: '40', color: '#111827', marginBottom: '32' } },
      ),
      cards,
    ],
    { backgroundColor: '#ffffff' },
  );
  projects.content = { anchorId: 'projects' };
  const contact = section(
    'Contact',
    [
      text(
        'heading',
        { text: 'Let’s make something good.' },
        { base: { fontSize: '44', color: '#ffffff' }, mobile: { fontSize: '34' } },
      ),
      text(
        'text',
        { text: 'Have a project in mind? Tell me what you’re working on.' },
        { base: { color: '#cbd5e1', fontSize: '18', marginTop: '14' } },
      ),
      text(
        'button',
        { text: 'Email me', url: 'mailto:hello@example.com' },
        { base: { backgroundColor: accent, marginTop: '26', borderRadius: '999' } },
      ),
    ],
    { backgroundColor: '#111827' },
  );
  contact.content = { anchorId: 'contact' };
  project.sections = [navbar, hero, about, projects, contact];
  return project;
}

export const templates = [
  {
    id: 'blank',
    name: 'Blank canvas',
    category: 'Minimal',
    description: 'Start with a clean page and build every section yourself.',
    project: createProject('Untitled Portfolio'),
  },
  {
    id: 'developer',
    name: 'Developer Portfolio',
    category: 'Developer',
    description: 'Technical, clear and project-led.',
    project: makeStarter({
      name: 'Alex Morgan',
      role: 'Product engineer',
      intro: 'I build fast, accessible web products that feel effortless to use.',
      accent: '#6d4aff',
      projectLabel: 'Things I’ve shipped',
    }),
  },
  {
    id: 'designer',
    name: 'Designer Portfolio',
    category: 'Designer',
    description: 'Editorial typography with confident project cards.',
    project: makeStarter({
      name: 'Mina Santos',
      role: 'Digital designer',
      intro: 'I shape brands and digital experiences with a focus on clarity and character.',
      accent: '#ea4c89',
      projectLabel: 'Selected case studies',
    }),
  },
  {
    id: 'photographer',
    name: 'Photographer Portfolio',
    category: 'Photographer',
    description: 'Quiet, image-forward structure.',
    project: makeStarter({
      name: 'Noah Reed',
      role: 'Photographer',
      intro: 'Documentary and portrait work about people, place, and the space between.',
      accent: '#d97706',
      projectLabel: 'Recent stories',
    }),
  },
  {
    id: 'freelancer',
    name: 'Freelancer Portfolio',
    category: 'Freelancer',
    description: 'Service-led portfolio designed for enquiries.',
    project: makeStarter({
      name: 'Jamie Chen',
      role: 'Independent creative',
      intro: 'Strategy, design, and development for ambitious small teams.',
      accent: '#0f9f84',
      projectLabel: 'Client work',
    }),
  },
  {
    id: 'student',
    name: 'Student Portfolio',
    category: 'Student',
    description: 'Friendly starter for coursework and first projects.',
    project: makeStarter({
      name: 'Taylor Kim',
      role: 'Design student',
      intro: 'Learning in public through experiments in interaction, type, and code.',
      accent: '#2563eb',
      projectLabel: 'Coursework & experiments',
    }),
  },
  {
    id: 'resume',
    name: 'Resume / CV',
    category: 'Professional',
    description: 'Experience-first professional profile.',
    project: makeStarter({
      name: 'Sam Rivera',
      role: 'Product leader',
      intro: 'I help teams turn customer insight into focused products and sustainable growth.',
      accent: '#4338ca',
      projectLabel: 'Career highlights',
    }),
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    category: 'Creative',
    description: 'Expressive type and vivid accents.',
    project: makeStarter({
      name: 'Ari Blake',
      role: 'Creative director',
      intro: 'Concepts, campaigns, and identities built to stay with people.',
      accent: '#f43f5e',
      projectLabel: 'Featured work',
    }),
  },
  {
    id: 'minimal',
    name: 'Minimal Portfolio',
    category: 'Minimal',
    description: 'Restrained layout with generous whitespace.',
    project: makeStarter({
      name: 'Robin Lee',
      role: 'Independent maker',
      intro: 'Small, useful digital things—designed and built with care.',
      accent: '#111827',
      projectLabel: 'A few good projects',
    }),
  },
];

export function getTemplate(id) {
  const found = templates.find((item) => item.id === id) || templates[0];
  const project = structuredClone(found.project);
  project.project.id = crypto.randomUUID
    ? `project_${crypto.randomUUID()}`
    : `project_${Date.now()}`;
  project.project.updatedAt = new Date().toISOString();
  return project;
}
