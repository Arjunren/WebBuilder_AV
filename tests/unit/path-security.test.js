import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { safeChildPath } from '../../src/server/utils/path-security.js';

describe('path boundaries', () => {
  it('keeps unsafe names inside the configured root', () => {
    const root = path.resolve('safe-root');
    const result = safeChildPath(root, '../../../../Windows/System32', '.json');
    expect(result.startsWith(`${root}${path.sep}`)).toBe(true);
    expect(result).toContain('windows-system32.json');
  });
});
