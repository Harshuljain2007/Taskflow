import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname);
const rulesContent = fs.readFileSync(path.join(ROOT_DIR, 'firestore.rules'), 'utf-8');
const blueprint = JSON.parse(
  fs.readFileSync(path.join(ROOT_DIR, 'firebase-blueprint.json'), 'utf-8'),
) as {
  entities: Record<string, { properties: Record<string, { maxLength?: number }>; required?: string[] }>;
  firestore: Record<string, { schema: { $ref: string } }>;
};

describe('Firestore Security Rules & Blueprint Integrity (All Modules)', () => {
  it('enforces rules_version 2 and default-deny global safety net', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toMatch(/match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  });

  it('defines match blocks covering every collection in firebase-blueprint.json', () => {
    const requiredSubPaths = [
      '/users/{userId}/public/profile',
      '/users/{userId}/private/info',
      '/users/{userId}/workspaceRefs/{workspaceId}',
      '/users/{userId}/notifications/{notificationId}',
      '/workspaces/{workspaceId}',
      '/members/{memberId}',
      '/invitations/{invitationId}',
      '/projects/{projectId}',
      '/tasks/{taskId}',
      '/subtasks/{subtaskId}',
      '/comments/{commentId}',
      '/attachments/{attachmentId}',
      '/activityLogs/{logId}',
      '/admins/{userId}',
    ];

    for (const segment of requiredSubPaths) {
      expect(rulesContent).toContain(segment);
    }
    expect(Object.keys(blueprint.firestore).length).toBeGreaterThanOrEqual(14);
  });

  it('enforces email_verified, Master Gate membership, and zero get()/exists() in allow list', () => {
    expect(rulesContent).toContain('request.auth.token.email_verified == true');
    expect(rulesContent).toContain('isWorkspaceMember(workspaceId)');
    expect(rulesContent).toContain('isWorkspaceContributor(workspaceId)');
    expect(rulesContent).toContain('isWorkspaceManager(workspaceId)');
    expect(rulesContent).toContain('isBootstrapAdmin()');

    // Verify allow list blocks do not call get() or exists()
    const listLines = rulesContent
      .split('\n')
      .filter((line) => line.trim().startsWith('allow list:'));
    for (const line of listLines) {
      expect(line).not.toContain('get(');
      expect(line).not.toContain('exists(');
    }
  });

  it('enforces PII isolation, immutable activity logs, and attachment MIME/size caps', () => {
    expect(blueprint.entities.UserPublicProfile.properties).not.toHaveProperty('email');
    expect(blueprint.entities.UserPrivateInfo.properties).toHaveProperty('email');
    expect(rulesContent).toContain('data.fileSize <= 204800');
    expect(rulesContent).toContain('data.contentData.size() <= 300000');
    expect(rulesContent).toContain('allow update, delete: if false;');
  });
});
