import path from 'node:path';
import { slugify } from '../../shared/model.js';

export function safeChildPath(root, unsafeName, extension = '') {
  const safeName = slugify(unsafeName);
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, `${safeName}${extension}`);
  const prefix = `${resolvedRoot}${path.sep}`;
  if (!candidate.startsWith(prefix)) throw new Error('Path is outside the allowed directory.');
  return candidate;
}

export function isWithin(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  return resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`);
}
