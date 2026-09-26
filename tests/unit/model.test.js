import { describe, expect, it } from 'vitest';
import {
  createComponent,
  createProject,
  escapeHtml,
  findNode,
  insertNode,
  isSafeUrl,
  moveNode,
  normalizeProject,
  removeNode,
  resolveStyles,
  slugify,
  validateProject,
} from '../../src/shared/model.js';
import { createBlock } from '../../src/client/js/components/factory.js';

describe('document model', () => {
  it('preserves component defaults when block presets add style overrides', () => {
    const hero = createBlock('hero');
    const button = findNode([hero], hero.children[0].children[3].id).node;
    expect(button.styles.base.backgroundColor).toBe('#6d4aff');
    expect(button.styles.base.paddingLeft).toBe('22');
    expect(button.styles.base.marginTop).toBe('26');
  });
  it('creates valid versioned projects and components', () => {
    const project = createProject('My Portfolio');
    const heading = createComponent('heading');
    insertNode(project.pages[0].sections, heading);
    expect(project.version).toBe(2);
    expect(findNode(project.pages[0].sections, heading.id)?.node.type).toBe('heading');
    expect(validateProject(project)).toEqual({ valid: true, errors: [] });
  });

  it('migrates saved version 1 projects without losing sections', () => {
    const heading = createComponent('heading');
    const migrated = normalizeProject({
      ...createProject('Legacy'),
      version: 1,
      sections: [heading],
      pages: undefined,
    });
    expect(migrated.version).toBe(2);
    expect(migrated.pages[0].slug).toBe('index');
    expect(migrated.pages[0].sections[0].id).toBe(heading.id);
  });

  it('deletes and reorders nested components', () => {
    const section = createComponent('section');
    const first = createComponent('heading');
    const second = createComponent('text');
    section.children.push(first, second);
    const nodes = [section];
    expect(moveNode(nodes, second.id, section.id, 0)).toBe(true);
    expect(section.children[0].id).toBe(second.id);
    expect(removeNode(nodes, first.id)?.id).toBe(first.id);
  });

  it('inherits responsive styles in cascade order', () => {
    const styles = {
      base: { fontSize: '40', color: 'black' },
      tablet: { fontSize: '32' },
      mobile: { color: 'blue' },
    };
    expect(resolveStyles(styles, 'mobile')).toEqual({ fontSize: '32', color: 'blue' });
  });
});

describe('security helpers', () => {
  it('creates safe slugs', () => expect(slugify('../../My Résumé!')).toBe('my-resume'));
  it('rejects unsafe URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html;base64,abc', { allowDataImages: true })).toBe(false);
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('#projects')).toBe(true);
  });
  it('escapes HTML', () =>
    expect(escapeHtml('<img onerror="x">')).toBe('&lt;img onerror=&quot;x&quot;&gt;'));
});
