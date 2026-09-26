import {
  escapeHtml,
  getPage,
  isSafeUrl,
  normalizeProject,
  resolveStyles,
  validateProject,
} from '../../shared/model.js';

const numberProperties = new Set([
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
  'width',
  'maxWidth',
  'minHeight',
  'height',
  'borderWidth',
  'borderRadius',
]);

const propertyMap = {
  backgroundColor: 'background-color',
  color: 'color',
  fontFamily: 'font-family',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  textAlign: 'text-align',
  textTransform: 'text-transform',
  marginTop: 'margin-top',
  marginRight: 'margin-right',
  marginBottom: 'margin-bottom',
  marginLeft: 'margin-left',
  paddingTop: 'padding-top',
  paddingRight: 'padding-right',
  paddingBottom: 'padding-bottom',
  paddingLeft: 'padding-left',
  gap: 'gap',
  width: 'width',
  maxWidth: 'max-width',
  minHeight: 'min-height',
  height: 'height',
  borderWidth: 'border-width',
  borderColor: 'border-color',
  borderStyle: 'border-style',
  borderRadius: 'border-radius',
  opacity: 'opacity',
  boxShadow: 'box-shadow',
  display: 'display',
  backgroundImage: 'background-image',
  backgroundPosition: 'background-position',
  backgroundSize: 'background-size',
  transition: 'transition',
};

function safeCssValue(key, value) {
  const raw = String(value ?? '').trim();
  if (!raw || /[{};<>]|javascript:|expression\s*\(/i.test(raw)) return '';
  if (numberProperties.has(key) && /^-?\d+(\.\d+)?$/.test(raw)) {
    if (key === 'width' && Number(raw) <= 100) return `${raw}%`;
    return `${raw}px`;
  }
  return raw;
}

function cssDeclarations(styles) {
  return Object.entries(styles || {})
    .filter(([key]) => propertyMap[key])
    .map(([key, value]) => {
      const safe = safeCssValue(key, value);
      return safe ? `${propertyMap[key]}:${safe}` : '';
    })
    .filter(Boolean)
    .join(';');
}

function nodeCss(node) {
  const selector = `[data-site-id="${node.id}"]`;
  let css = `${selector}{${cssDeclarations(node.styles?.base)}}`;
  if (node.styles?.base?.hoverBackgroundColor) {
    css += `${selector}:hover{background-color:${safeCssValue('backgroundColor', node.styles.base.hoverBackgroundColor)}}`;
  }
  if (node.type === 'columns' || node.type === 'grid') {
    const base = resolveStyles(node.styles, 'base');
    const tablet = resolveStyles(node.styles, 'tablet');
    const mobile = resolveStyles(node.styles, 'mobile');
    css += `${selector}{display:grid;grid-template-columns:repeat(${Math.max(1, Number(base.columns) || 1)},minmax(0,1fr))}`;
    css += `@media(max-width:900px){${selector}{${cssDeclarations(node.styles?.tablet)};grid-template-columns:repeat(${Math.max(1, Number(tablet.columns) || 1)},minmax(0,1fr))}}`;
    css += `@media(max-width:600px){${selector}{${cssDeclarations(node.styles?.mobile)};grid-template-columns:repeat(${Math.max(1, Number(mobile.columns) || 1)},minmax(0,1fr))}}`;
  } else {
    css += `@media(max-width:900px){${selector}{${cssDeclarations(node.styles?.tablet)}}}`;
    css += `@media(max-width:600px){${selector}{${cssDeclarations(node.styles?.mobile)}}}`;
  }
  return css;
}

function renderLinks(raw = '') {
  return String(raw)
    .split('\n')
    .map((row) => {
      const [label, href = '#'] = row.split('|');
      const safeHref = isSafeUrl(href) ? href : '#';
      return `<a href="${escapeHtml(safeHref)}">${escapeHtml(label)}</a>`;
    })
    .join('');
}

function renderRichText(value = '') {
  return String(value)
    .split(/\n\s*\n/)
    .map((paragraph) => {
      let safe = escapeHtml(paragraph).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      safe = safe.replace(/\*([^*]+)\*/g, '<em>$1</em>').replaceAll('\n', '<br>');
      return `<p>${safe}</p>`;
    })
    .join('');
}

function renderNode(node) {
  const attr = `data-site-id="${escapeHtml(node.id)}"`;
  const anchor =
    node.content?.anchorId && /^[A-Za-z][\w-]*$/.test(node.content.anchorId)
      ? ` id="${node.content.anchorId}"`
      : '';
  const children = () => (node.children || []).map(renderNode).join('');
  switch (node.type) {
    case 'section':
      return `<section ${attr}${anchor}>${children()}</section>`;
    case 'container':
      return `<div class="site-container" ${attr}${anchor}>${children()}</div>`;
    case 'columns':
    case 'grid':
      return `<div ${attr}${anchor}>${children()}</div>`;
    case 'spacer':
      return `<div ${attr} aria-hidden="true"></div>`;
    case 'divider':
      return `<hr ${attr}>`;
    case 'heading': {
      const level = /^h[1-6]$/.test(node.content?.level) ? node.content.level : 'h2';
      return `<${level} ${attr}${anchor}>${escapeHtml(node.content?.text).replaceAll('\n', '<br>')}</${level}>`;
    }
    case 'text':
      return `<p ${attr}${anchor}>${escapeHtml(node.content?.text).replaceAll('\n', '<br>')}</p>`;
    case 'richText':
      return `<div class="rich-text" ${attr}${anchor}>${renderRichText(node.content?.text)}</div>`;
    case 'quote':
      return `<blockquote ${attr}${anchor}>${escapeHtml(node.content?.text)}<cite>${escapeHtml(node.content?.author)}</cite></blockquote>`;
    case 'list':
      return `<ul ${attr}${anchor}>${String(node.content?.text || '')
        .split('\n')
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul>`;
    case 'button':
    case 'link': {
      const href = isSafeUrl(node.content?.url) ? node.content.url : '#';
      const target = node.content?.newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a class="${node.type === 'button' ? 'site-button' : 'site-link'}" ${attr}${anchor} href="${escapeHtml(href)}"${target}>${escapeHtml(node.content?.text)}</a>`;
    }
    case 'image': {
      const src = isSafeUrl(node.content?.src, { allowDataImages: true }) ? node.content.src : '';
      return `<img ${attr}${anchor} src="${escapeHtml(src)}" alt="${escapeHtml(node.content?.alt)}" loading="lazy">`;
    }
    case 'video': {
      const src = isSafeUrl(node.content?.url) ? node.content.url : '';
      return `<div class="video-wrap" ${attr}${anchor}><iframe src="${escapeHtml(src)}" title="${escapeHtml(node.content?.title || 'Video')}" loading="lazy" allowfullscreen></iframe></div>`;
    }
    case 'icon':
      return `<span ${attr}${anchor} aria-hidden="true">${escapeHtml(node.content?.text)}</span>`;
    case 'navbar':
      return `<header class="site-nav" ${attr}${anchor}><a class="brand" href="#home">${escapeHtml(node.content?.brand)}</a><button class="menu-toggle" aria-expanded="false" aria-controls="site-menu"><span class="sr-only">Toggle navigation</span>☰</button><nav id="site-menu">${renderLinks(node.content?.links)}</nav></header>`;
    case 'social':
      return `<nav class="social-links" aria-label="Social links" ${attr}${anchor}>${renderLinks(node.content?.links)}</nav>`;
    case 'contactForm': {
      const endpoint = isSafeUrl(node.content?.endpoint) ? node.content.endpoint : '';
      return `<form ${attr}${anchor} action="${escapeHtml(endpoint)}" method="post"><label>Name<input name="name" required autocomplete="name"></label><label>Email<input type="email" name="email" required autocomplete="email"></label><label>Subject<input name="subject"></label><label>Message<textarea name="message" rows="5" required></textarea></label><button type="submit">${escapeHtml(node.content?.submitLabel || 'Send message')}</button>${endpoint ? '' : '<p class="form-note">Connect a form endpoint before publishing to receive messages.</p>'}</form>`;
    }
    default:
      return '';
  }
}

function collectCss(nodes) {
  return nodes.map((node) => `${nodeCss(node)}${collectCss(node.children || [])}`).join('');
}

function sanitizeCustomCss(value = '') {
  const css = String(value).slice(0, 20000);
  if (/@import|expression\s*\(|javascript:|<\/style/i.test(css)) return '';
  return css;
}

export function renderExport(input, pageId = null) {
  const project = normalizeProject(input);
  const validation = validateProject(project);
  if (!validation.valid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }
  const page = getPage(project, pageId);
  if (!page) {
    const error = new Error('The requested page does not exist.');
    error.status = 404;
    throw error;
  }
  const seo = project.seo || {};
  const theme = project.theme || {};
  const title =
    page.slug === 'index'
      ? seo.title || project.project.name
      : `${page.name} — ${seo.title || project.project.name}`;
  const favicon = isSafeUrl(seo.favicon, { allowDataImages: true })
    ? seo.favicon
    : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="16" fill="%236d4aff"/%3E%3Cpath d="M18 42V18h15c9 0 14 4 14 12s-5 12-14 12H18zm9-8h7c3 0 5-1 5-4s-2-4-5-4h-7v8z" fill="white"/%3E%3C/svg%3E';
  const canonical =
    isSafeUrl(seo.canonicalUrl) && seo.canonicalUrl
      ? `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}">`
      : '';
  const ogImage =
    isSafeUrl(seo.ogImage, { allowDataImages: true }) && seo.ogImage
      ? `<meta property="og:image" content="${escapeHtml(seo.ogImage)}">`
      : '';
  const body = page.sections.map(renderNode).join('');
  const css = collectCss(page.sections);
  const buttonRadius =
    theme.buttonStyle === 'pill' ? '999px' : theme.buttonStyle === 'square' ? '0' : 'var(--radius)';
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(seo.description)}"><meta name="author" content="${escapeHtml(seo.author)}">
<meta property="og:title" content="${escapeHtml(seo.ogTitle || title)}"><meta property="og:description" content="${escapeHtml(seo.ogDescription || seo.description)}">${ogImage}${canonical}
<link rel="icon" href="${escapeHtml(favicon)}"><style>
:root{--primary:${safeCssValue('color', theme.primaryColor || '#6d4aff')};--text:${safeCssValue('color', theme.textColor || '#1e293b')};--bg:${safeCssValue('color', theme.backgroundColor || '#fff')};--radius:${safeCssValue('borderRadius', theme.borderRadius || '12')};--button-radius:${buttonRadius};--container:${safeCssValue('maxWidth', theme.containerWidth || '1120')}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font-family:${safeCssValue('fontFamily', theme.fontFamily || 'system-ui,sans-serif')};line-height:1.5}img{display:block;max-width:100%;height:auto}a{color:inherit}h1,h2,h3,h4,h5,h6,p{margin-top:0}h1,h2,h3,h4,h5,h6{font-family:${safeCssValue('fontFamily', theme.headingFontFamily || theme.fontFamily || 'system-ui,sans-serif')}}.site-container{width:100%;max-width:var(--container);margin-inline:auto}.site-button{display:inline-flex;text-decoration:none;align-items:center;justify-content:center;border-radius:var(--button-radius)}.site-nav{display:flex;align-items:center;justify-content:space-between;padding-inline:max(24px,calc((100% - var(--container))/2));position:relative;z-index:10}.site-nav .brand{font-weight:800;text-decoration:none;font-size:1.2rem}.site-nav nav{display:flex;gap:28px}.site-nav nav a,.social-links a{text-decoration:none}.menu-toggle{display:none;border:0;background:transparent;font-size:1.5rem}.video-wrap{aspect-ratio:16/9}.video-wrap iframe{width:100%;height:100%;border:0;border-radius:inherit}blockquote{border-left:4px solid;padding-left:24px;margin-left:0}blockquote cite{display:block;font-size:.65em;margin-top:12px}form{display:grid;gap:16px}form label{display:grid;gap:6px;font-weight:600}input,textarea{width:100%;padding:12px;border:1px solid #cbd5e1;border-radius:8px;font:inherit}form button{justify-self:start;border:0;border-radius:var(--button-radius);background:var(--primary);color:white;padding:12px 20px;font:inherit;font-weight:700}.form-note{font-size:.875rem;color:#64748b}.social-links{display:flex}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}:focus-visible{outline:3px solid var(--primary);outline-offset:3px}
${css}${sanitizeCustomCss(theme.customCss)}
@media(max-width:600px){.site-nav{padding-inline:20px}.menu-toggle{display:block}.site-nav nav{display:none;position:absolute;left:16px;right:16px;top:calc(100% + 8px);background:white;color:#111827;padding:18px;border-radius:12px;box-shadow:0 16px 40px rgba(15,23,42,.18);flex-direction:column}.site-nav nav.open{display:flex}}
</style></head><body>${body}<script>document.querySelectorAll('.menu-toggle').forEach(function(b){b.addEventListener('click',function(){var n=document.getElementById(b.getAttribute('aria-controls'));var o=n.classList.toggle('open');b.setAttribute('aria-expanded',String(o))})})</script></body></html>`;
}
