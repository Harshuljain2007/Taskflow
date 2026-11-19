interface FirestoreTimestampLike {
  toDate: () => Date;
}

export function toJsDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as FirestoreTimestampLike).toDate === 'function'
  ) {
    return (value as FirestoreTimestampLike).toDate();
  }
  return null;
}

export function formatShortDate(value: unknown): string {
  const date = toJsDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelativeDateTime(value: unknown): string {
  const date = toJsDate(value);
  if (!date) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function isOverdueDate(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'done' || status === 'completed' || status === 'archived') {
    return false;
  }
  const todayStr = new Date().toISOString().slice(0, 10);
  return dueDate < todayStr;
}

export function isApproachingDate(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === 'done' || status === 'completed' || status === 'archived') {
    return false;
  }
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const inThreeDays = new Date(today.getTime() + 3 * 86_400_000).toISOString().slice(0, 10);
  return dueDate >= todayStr && dueDate <= inThreeDays;
}
