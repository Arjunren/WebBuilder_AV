import { createBlock } from './components/factory.js';

const supportedBlocks = new Set([
  'hero',
  'about',
  'skills',
  'services',
  'experience',
  'education',
  'projects',
  'testimonials',
  'contact',
  'footer',
  'faq',
  'cta',
  'statistics',
  'timeline',
  'logoGrid',
]);

export function registerWebMcpTools(store) {
  const context = document.modelContext;
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  const register = (tool) => {
    try {
      void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(
        () => {},
      );
    } catch {
      // WebMCP is progressive enhancement; the visible editor remains fully functional.
    }
  };

  register({
    name: 'get_portfolio_project_summary',
    title: 'Read portfolio project summary',
    description:
      'Read the active portfolio project name, viewport, section count, and save status.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute() {
      return {
        name: store.project?.project?.name || '',
        viewport: store.viewport,
        rootSections: store.sections().length,
        pages: store.project?.pages?.length || 0,
        totalElements: store.elementCount(),
        saved: store.saved,
      };
    },
  });

  register({
    name: 'add_portfolio_section',
    title: 'Add portfolio section',
    description: 'Add one supported portfolio section to the active page and select it.',
    inputSchema: {
      type: 'object',
      properties: { type: { type: 'string', enum: [...supportedBlocks] } },
      required: ['type'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || typeof input !== 'object' || !supportedBlocks.has(input.type)) {
        throw new Error('Choose a supported portfolio section type.');
      }
      const block = createBlock(input.type);
      store.add(input.type, block);
      return {
        added: true,
        id: block.id,
        type: input.type,
        rootSections: store.sections().length,
      };
    },
  });

  register({
    name: 'set_portfolio_preview_device',
    title: 'Set preview device',
    description: 'Switch the editor canvas between desktop, tablet, and mobile preview modes.',
    inputSchema: {
      type: 'object',
      properties: { device: { type: 'string', enum: ['desktop', 'tablet', 'mobile'] } },
      required: ['device'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const viewport = { desktop: 'base', tablet: 'tablet', mobile: 'mobile' }[input?.device];
      if (!viewport) throw new Error('Choose desktop, tablet, or mobile.');
      store.setViewport(viewport);
      return { device: input.device, viewport };
    },
  });

  return () => lifecycle.abort();
}
