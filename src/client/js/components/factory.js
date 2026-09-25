import { createComponent } from '../../../shared/model.js';

const content = (type, updates = {}, styles = {}) => {
  const node = createComponent(type);
  node.content = { ...node.content, ...updates };
  node.styles = {
    ...node.styles,
    ...styles,
    base: { ...(node.styles.base || {}), ...(styles.base || {}) },
    tablet: { ...(node.styles.tablet || {}), ...(styles.tablet || {}) },
    mobile: { ...(node.styles.mobile || {}), ...(styles.mobile || {}) },
  };
  return node;
};

const container = (children, styles = {}) =>
  createComponent('container', {
    children,
    styles: { base: { ...createComponent('container').styles.base, ...styles } },
  });

const section = (name, children, styles = {}, anchorId = '') =>
  createComponent('section', {
    name,
    content: { anchorId },
    styles: {
      base: { paddingTop: '72', paddingBottom: '72', backgroundColor: '#ffffff', ...styles },
    },
    children: [container(children)],
  });

const title = (value) =>
  content(
    'heading',
    { text: value },
    {
      base: { fontSize: '40', fontWeight: '750', color: '#111827', marginBottom: '18' },
      mobile: { fontSize: '32' },
    },
  );
const paragraph = (value) => content('text', { text: value });

function card(titleText, body) {
  return container(
    [
      content(
        'heading',
        { text: titleText },
        { base: { fontSize: '22', color: '#111827', marginBottom: '10' } },
      ),
      paragraph(body),
    ],
    {
      backgroundColor: '#f5f7fa',
      paddingTop: '24',
      paddingBottom: '24',
      paddingLeft: '24',
      paddingRight: '24',
      borderRadius: '16',
    },
  );
}

export function createBlock(type) {
  if (
    [
      'section',
      'container',
      'columns',
      'grid',
      'spacer',
      'divider',
      'heading',
      'text',
      'richText',
      'quote',
      'list',
      'button',
      'link',
      'image',
      'video',
      'icon',
      'navbar',
      'social',
      'contactForm',
    ].includes(type)
  )
    return createComponent(type);
  switch (type) {
    case 'avatar':
      return content(
        'image',
        { alt: 'Profile portrait' },
        { base: { width: '220', borderRadius: '999' } },
      );
    case 'gallery':
      return createComponent('grid', {
        name: 'Image gallery',
        children: [createComponent('image'), createComponent('image'), createComponent('image')],
      });
    case 'brand':
      return content(
        'heading',
        { text: 'Your Brand', level: 'h3' },
        { base: { fontSize: '24', fontWeight: '800' } },
      );
    case 'navLinks':
      return createComponent('social', {
        name: 'Navigation links',
        content: { links: 'About|#about\nProjects|#projects\nContact|#contact' },
      });
    case 'projectCard':
      return card('Project title', 'Describe the challenge, your role, and the outcome.');
    case 'hero':
      return section(
        'Hero',
        [
          content('icon', { text: '✦' }),
          content(
            'heading',
            { text: 'I make digital ideas feel simple.' },
            {
              base: {
                fontSize: '64',
                fontWeight: '800',
                lineHeight: '1.04',
                maxWidth: '800',
                color: '#111827',
              },
              tablet: { fontSize: '52' },
              mobile: { fontSize: '40' },
            },
          ),
          content(
            'text',
            {
              text: 'Designer, developer, and thoughtful problem-solver. I create useful experiences for ambitious teams.',
            },
            { base: { fontSize: '20', maxWidth: '680', marginTop: '22' } },
          ),
          content(
            'button',
            { text: 'See my work', url: '#projects' },
            { base: { marginTop: '26', borderRadius: '999' } },
          ),
        ],
        { backgroundColor: '#f5f3ff', paddingTop: '110', paddingBottom: '110' },
        'home',
      );
    case 'about':
      return section(
        'About me',
        [
          title('About me'),
          paragraph(
            'I care about the details that make products easier, clearer, and more enjoyable. Add your background, values, and what makes your perspective distinct.',
          ),
        ],
        {},
        'about',
      );
    case 'skills':
      return section(
        'Skills',
        [
          title('Skills & tools'),
          createComponent('grid', {
            children: [
              card('Design', 'Product design, systems, research'),
              card('Development', 'HTML, CSS, JavaScript'),
              card('Collaboration', 'Strategy, facilitation, mentoring'),
            ],
          }),
        ],
        { backgroundColor: '#f8fafc' },
        'skills',
      );
    case 'services':
      return section(
        'Services',
        [
          title('How I can help'),
          createComponent('grid', {
            children: [
              card('Product strategy', 'Shape the right problem before building.'),
              card('Design systems', 'Create consistent experiences that scale.'),
              card('Web development', 'Build fast, accessible, maintainable sites.'),
            ],
          }),
        ],
        {},
        'services',
      );
    case 'experience':
      return section(
        'Experience',
        [
          title('Experience'),
          card('2024 — Present', 'Role title · Company — Describe your focus and impact.'),
          card('2021 — 2024', 'Previous role · Company — Add a concise achievement.'),
        ],
        {},
        'experience',
      );
    case 'education':
      return section(
        'Education',
        [title('Education'), card('Your degree or course', 'School name · Year')],
        { backgroundColor: '#f8fafc' },
        'education',
      );
    case 'projects':
      return section(
        'Projects',
        [
          title('Selected projects'),
          createComponent('grid', {
            children: [
              card('Project one', 'A short description of the outcome and your role.'),
              card('Project two', 'What made this project challenging and useful.'),
              card('Project three', 'The result, impact, or lesson worth sharing.'),
            ],
          }),
        ],
        {},
        'projects',
      );
    case 'portfolioGallery':
      return section(
        'Portfolio gallery',
        [
          title('Portfolio gallery'),
          createComponent('grid', {
            children: [
              createComponent('image'),
              createComponent('image'),
              createComponent('image'),
            ],
          }),
        ],
        {},
        'gallery',
      );
    case 'testimonials':
      return section(
        'Testimonials',
        [
          title('Kind words'),
          content('quote', {
            text: 'A thoughtful partner who made a difficult project feel clear and achievable.',
            author: 'Client name · Role',
          }),
        ],
        { backgroundColor: '#f5f3ff' },
        'testimonials',
      );
    case 'certifications':
      return section(
        'Certifications',
        [
          title('Certifications'),
          createComponent('grid', {
            children: [
              card('Certification name', 'Issuing organization · 2026'),
              card('Certification name', 'Issuing organization · 2025'),
            ],
          }),
        ],
        { backgroundColor: '#f8fafc' },
        'certifications',
      );
    case 'awards':
      return section(
        'Awards',
        [
          title('Awards & recognition'),
          card('Award name', 'Organization · 2026 — Add why it matters.'),
        ],
        {},
        'awards',
      );
    case 'resume':
      return section(
        'Resume download',
        [
          title('Experience at a glance'),
          paragraph('Offer a PDF resume or CV for people who want the complete details.'),
          content(
            'button',
            { text: 'Download resume', url: '#resume' },
            { base: { marginTop: '20' } },
          ),
        ],
        { backgroundColor: '#f5f3ff' },
        'resume',
      );
    case 'contact':
      return section(
        'Contact',
        [
          title('Let’s work together'),
          paragraph('Tell me a little about your project and what you hope to achieve.'),
          createComponent('contactForm'),
        ],
        { backgroundColor: '#f8fafc' },
        'contact',
      );
    case 'footer':
      return section(
        'Footer',
        [
          content(
            'text',
            { text: '© 2026 Your Name. Built with care.' },
            { base: { color: '#cbd5e1' } },
          ),
          content('social'),
        ],
        { backgroundColor: '#111827', paddingTop: '40', paddingBottom: '40' },
      );
    case 'faq':
      return section(
        'FAQ',
        [
          title('Frequently asked questions'),
          card(
            'What kind of projects do you take on?',
            'Share the kind of work, timeline, and budget range that is a good fit.',
          ),
          card(
            'How can we get started?',
            'Explain the easiest way to contact you and what information is helpful.',
          ),
        ],
        {},
        'faq',
      );
    case 'cta':
      return section(
        'Call to action',
        [
          title('Have something in mind?'),
          paragraph('Let’s talk about how to bring it to life.'),
          content(
            'button',
            { text: 'Start a conversation', url: 'mailto:hello@example.com' },
            { base: { marginTop: '20' } },
          ),
        ],
        { backgroundColor: '#f5f3ff' },
      );
    case 'statistics':
      return section(
        'Statistics',
        [
          createComponent('grid', {
            children: [
              card('12+', 'Projects completed'),
              card('5 years', 'Hands-on experience'),
              card('98%', 'Happy collaborators'),
            ],
          }),
        ],
        { backgroundColor: '#111827' },
        'impact',
      );
    case 'timeline':
      return section(
        'Timeline',
        [
          title('My journey'),
          card('2026 — Now', 'Describe the work you are doing today.'),
          card('2024 — 2026', 'Add a meaningful role or milestone.'),
        ],
        {},
        'timeline',
      );
    case 'logoGrid':
      return section(
        'Technology grid',
        [
          title('Tools I work with'),
          createComponent('grid', {
            children: ['Figma', 'JavaScript', 'Node.js', 'GitHub', 'Tailwind', 'Accessibility'].map(
              (name) => card(name, ''),
            ),
          }),
        ],
        { backgroundColor: '#f8fafc' },
        'tools',
      );
    default:
      return createComponent('text');
  }
}
