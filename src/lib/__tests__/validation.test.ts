import { describe, expect, it } from 'vitest';
import {
  formatRelativeDateTime,
  formatShortDate,
  isApproachingDate,
  isOverdueDate,
  toJsDate,
} from '../dateUtils.ts';
import {
  generateId,
  invitationSchema,
  profileSchema,
  projectSchema,
  taskSchema,
  toSlug,
  workspaceSchema,
} from '../validation.ts';

describe('Validation schemas and helpers', () => {
  it('validates workspace creation inputs', () => {
    const valid = workspaceSchema.safeParse({
      name: 'Acme Engineering',
      description: 'Core product workspace',
      defaultTaskStatus: 'todo',
      allowViewerComments: true,
    });
    expect(valid.success).toBe(true);

    const invalid = workspaceSchema.safeParse({ name: 'A' });
    expect(invalid.success).toBe(false);
  });

  it('validates invitation role and email constraints', () => {
    expect(
      invitationSchema.safeParse({ email: 'teammate@example.com', role: 'member' }).success,
    ).toBe(true);
    expect(invitationSchema.safeParse({ email: 'bad-email', role: 'member' }).success).toBe(false);
    expect(
      invitationSchema.safeParse({ email: 'teammate@example.com', role: 'owner' }).success,
    ).toBe(false);
  });

  it('validates and normalizes project keys', () => {
    const parsed = projectSchema.parse({
      name: 'Mobile Release',
      key: 'mob2',
      description: 'iOS and Android launch',
    });
    expect(parsed.key).toBe('MOB2');

    expect(
      projectSchema.safeParse({ name: 'Bad Key', key: 'mob-1' }).success,
    ).toBe(false);
  });

  it('validates task payloads and profile fields', () => {
    expect(
      taskSchema.safeParse({ projectId: 'proj-1', title: 'Ship Kanban board' }).success,
    ).toBe(true);
    expect(taskSchema.safeParse({ projectId: '', title: '' }).success).toBe(false);

    expect(profileSchema.safeParse({ displayName: 'Alex Rivera' }).success).toBe(true);
    expect(profileSchema.safeParse({ displayName: '' }).success).toBe(false);
  });

  it('generates clean URL slugs and unique IDs', () => {
    expect(toSlug('  Q2 Release!! Team  ')).toBe('q2-release-team');
    expect(toSlug('!')).toBe('workspace');

    const a = generateId();
    const b = generateId();
    expect(a.length).toBeGreaterThan(8);
    expect(a).not.toBe(b);
  });
});

describe('Date utility helpers', () => {
  it('parses Date, ISO strings, and Firestore Timestamp-like objects', () => {
    const now = new Date('2026-05-01T12:00:00Z');
    expect(toJsDate(now)?.toISOString()).toBe('2026-05-01T12:00:00.000Z');
    expect(toJsDate('2026-05-02T00:00:00Z')?.getUTCDate()).toBe(2);
    expect(toJsDate({ toDate: () => now })?.getTime()).toBe(now.getTime());
    expect(toJsDate('not-a-date')).toBeNull();
  });

  it('detects overdue and approaching deadlines correctly while ignoring done tasks', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

    expect(isOverdueDate(yesterday, 'in_progress')).toBe(true);
    expect(isOverdueDate(yesterday, 'done')).toBe(false);

    expect(isApproachingDate(tomorrow, 'todo')).toBe(true);
    expect(isApproachingDate(tomorrow, 'done')).toBe(false);
    expect(isApproachingDate(nextMonth, 'todo')).toBe(false);

    expect(formatShortDate(null)).toBe('—');
    expect(formatRelativeDateTime(new Date())).toBe('Just now');
  });
});
