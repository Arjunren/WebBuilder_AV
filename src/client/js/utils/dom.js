export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== false && value != null) node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of Array.isArray(children) ? children : [children]) node.append(child);
  return node;
}

export function toast(message, tone = 'info') {
  const region = $('#toast-region');
  const item = el('div', {
    class: `toast ${tone === 'error' ? 'border-rose-500/50' : ''}`,
    text: message,
    role: 'status',
  });
  region.append(item);
  setTimeout(() => item.remove(), 3500);
}

export function showModal(id) {
  $(`#${id}`).classList.remove('hidden');
}
export function hideModal(id) {
  $(`#${id}`).classList.add('hidden');
}
