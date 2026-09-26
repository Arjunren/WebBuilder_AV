import { describe, expect, it } from 'vitest';
import { createComponent, createProject } from '../../src/shared/model.js';
import { renderExport } from '../../src/server/services/export-renderer.js';

describe('export renderer', () => {
  it('creates standalone semantic HTML without editor metadata', () => {
    const project = createProject('Test Site');
    const section = createComponent('section');
    const heading = createComponent('heading');
    heading.content.text = 'Hello portfolio';
    section.children.push(heading);
    project.pages[0].sections.push(section);
    const html = renderExport(project);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<section');
    expect(html).toContain('Hello portfolio');
    expect(html).not.toContain('editor-node');
    expect(html).not.toContain('contenteditable');
  });

  it('escapes stored XSS payloads and neutralizes unsafe custom CSS', () => {
    const project = createProject('Security Test');
    const heading = createComponent('heading');
    heading.content.text = '<img src=x onerror=alert(1)>';
    project.theme.customCss = '</style><script>alert(1)</script>';
    project.pages[0].sections.push(heading);
    const html = renderExport(project);
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('renders safe rich-text emphasis without accepting HTML', () => {
    const project = createProject('Rich text test');
    const richText = createComponent('richText');
    richText.content.text = 'A **strong** idea with *detail*.\n\n<img onerror="bad">';
    project.pages[0].sections.push(richText);
    const html = renderExport(project);
    expect(html).toContain('<strong>strong</strong>');
    expect(html).toContain('<em>detail</em>');
    expect(html).toContain('&lt;img onerror=&quot;bad&quot;&gt;');
  });
});
