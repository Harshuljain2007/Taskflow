import { describe, expect, it } from 'vitest';
import { cn, formatUptime } from '../utils.ts';

describe('Frontend utility helpers', () => {
  it('merges conflicting Tailwind utility classes cleanly', () => {
    expect(cn('px-3 py-2 text-sm', 'px-4 text-base')).toBe('py-2 px-4 text-base');
  });

  it('formats uptime durations accurately', () => {
    expect(formatUptime(42)).toBe('42s');
    expect(formatUptime(125)).toBe('2m 5s');
    expect(formatUptime(3665)).toBe('1h 1m 5s');
  });
});
