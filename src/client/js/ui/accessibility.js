import { walkNodes } from '../../../shared/model.js';

export function auditProject(project) {
  const issues = [];
  let checks = 0;
  for (const page of project.pages || []) {
    const headings = [];
    walkNodes(page.sections, (node) => {
      if (node.type === 'heading') headings.push(node);
      if (node.type === 'image') {
        checks += 1;
        if (!String(node.content?.alt || '').trim())
          issues.push({ page: page.name, message: `Image “${node.name}” needs alternative text.` });
      }
      if (node.type === 'button' || node.type === 'link') {
        checks += 1;
        if (!String(node.content?.text || '').trim())
          issues.push({ page: page.name, message: `${node.name} needs a descriptive label.` });
      }
    });
    checks += 1;
    const h1s = headings.filter((node) => node.content?.level === 'h1');
    if (h1s.length === 0)
      issues.push({ page: page.name, message: 'Add one H1 heading for the page title.' });
    if (h1s.length > 1)
      issues.push({ page: page.name, message: 'Use only one H1 heading on this page.' });
    let previousLevel = 0;
    for (const heading of headings) {
      const level = Number(String(heading.content?.level || 'h2').slice(1));
      checks += 1;
      if (previousLevel && level > previousLevel + 1)
        issues.push({
          page: page.name,
          message: `Heading “${heading.content?.text || heading.name}” skips a level.`,
        });
      previousLevel = level;
    }
  }
  return { checks, issues };
}
