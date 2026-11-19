import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Trash2 } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Dialog } from '@/src/components/ui/Dialog';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { syncUserProfileToFirestore } from '@/src/lib/firebase';
import {
  TASK_STATUSES,
  profileSchema,
  workspaceSchema,
} from '@/src/lib/validation';
import {
  getUserPrivateInfo,
  getUserPublicProfile,
  updateUserPreferences,
  updateUserPublicProfile,
} from '@/src/services/firestore/userService';
import {
  deleteWorkspace,
  updateWorkspaceDetails,
} from '@/src/services/firestore/workspaceService';
import { useUiStore } from '@/src/stores/uiStore';
import type { TaskStatus } from '@/src/types/domain';

type ProfileFormValues = z.input<typeof profileSchema>;
type WorkspaceFormValues = z.input<typeof workspaceSchema>;

export function SettingsPage() {
  const { user } = useFirebase();
  const {
    activeWorkspace,
    activeWorkspaceId,
    members,
    canManage,
    isWorkspaceOwner,
  } = useWorkspace();
  const setActiveWorkspaceId = useUiStore((s) => s.setActiveWorkspaceId);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [notifyTaskAssigned, setNotifyTaskAssigned] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('light');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const [wsSaved, setWsSaved] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingWs, setDeletingWs] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      jobTitle: '',
      bio: '',
    },
  });

  const workspaceForm = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: '',
      description: '',
      defaultTaskStatus: 'todo',
      allowViewerComments: true,
    },
  });

  const { reset: resetProfileForm } = profileForm;
  const { reset: resetWorkspaceForm } = workspaceForm;

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadUserDocs = async () => {
      try {
        let [pub, priv] = await Promise.all([
          getUserPublicProfile(user.uid),
          getUserPrivateInfo(user.uid),
        ]);

        if (!pub || !priv) {
          await syncUserProfileToFirestore(user);
          [pub, priv] = await Promise.all([
            getUserPublicProfile(user.uid),
            getUserPrivateInfo(user.uid),
          ]);
        }

        if (!active) return;

        resetProfileForm({
          displayName: pub?.displayName || user.displayName || '',
          jobTitle: pub?.jobTitle || '',
          bio: pub?.bio || '',
        });

        setNotifyTaskAssigned(priv?.notifyTaskAssigned ?? true);
        setNotifyComments(priv?.notifyComments ?? true);
        setNotifyDeadlines(priv?.notifyDeadlines ?? true);
        setThemePreference(priv?.themePreference ?? 'light');
      } catch (err) {
        if (active) {
          setProfileError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    void loadUserDocs();
    return () => {
      active = false;
    };
  }, [user, resetProfileForm]);

  useEffect(() => {
    if (!activeWorkspace) return;
    resetWorkspaceForm({
      name: activeWorkspace.name,
      description: activeWorkspace.description ?? '',
      defaultTaskStatus: activeWorkspace.defaultTaskStatus,
      allowViewerComments: activeWorkspace.allowViewerComments,
    });
  }, [activeWorkspace, resetWorkspaceForm]);

  const handleSaveProfile = async (values: ProfileFormValues) => {
    if (!user) return;
    setProfileError(null);
    setProfileSaved(false);
    try {
      await updateUserPublicProfile({
        uid: user.uid,
        displayName: values.displayName,
        jobTitle: values.jobTitle,
        bio: values.bio,
      });
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Unable to save profile');
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.email) return;
    setSavingPrefs(true);
    setPrefsError(null);
    setPrefsSaved(false);
    try {
      await updateUserPreferences({
        uid: user.uid,
        email: user.email,
        notifyTaskAssigned,
        notifyComments,
        notifyDeadlines,
        themePreference,
      });
      setPrefsSaved(true);
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : 'Unable to update preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSaveWorkspace = async (values: WorkspaceFormValues) => {
    if (!user || !activeWorkspace || !canManage) return;
    setWsError(null);
    setWsSaved(false);
    try {
      await updateWorkspaceDetails({
        workspaceId: activeWorkspace.id,
        name: values.name,
        description: values.description,
        defaultTaskStatus: (values.defaultTaskStatus ?? 'todo') as TaskStatus,
        allowViewerComments: values.allowViewerComments ?? true,
        memberUserIds: members.map((m) => m.userId),
        actorId: user.uid,
        actorName: user.displayName || user.email?.split('@')[0] || 'Member',
      });
      setWsSaved(true);
    } catch (err) {
      setWsError(err instanceof Error ? err.message : 'Unable to update workspace');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!user || !activeWorkspaceId || !isWorkspaceOwner) return;
    setDeletingWs(true);
    setWsError(null);
    try {
      await deleteWorkspace(activeWorkspaceId, user.uid);
      setDeleteDialogOpen(false);
      setActiveWorkspaceId(null);
    } catch (err) {
      setWsError(err instanceof Error ? err.message : 'Unable to delete workspace');
    } finally {
      setDeletingWs(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">Settings</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage your profile, notification preferences, and active workspace configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>
              Displayed to teammates inside workspaces, comments, and task assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium text-[#171923]">
                  Account Email
                </label>
                <Input
                  id="profile-email"
                  value={user?.email ?? ''}
                  disabled
                  className="mt-1.5 bg-[#F7F8FA] text-[#6B7280]"
                />
              </div>

              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-[#171923]">
                  Display Name
                </label>
                <Input
                  id="profile-name"
                  disabled={loadingProfile}
                  className="mt-1.5"
                  {...profileForm.register('displayName')}
                />
                {profileForm.formState.errors.displayName ? (
                  <p className="mt-1 text-xs text-[#DC2626]">
                    {profileForm.formState.errors.displayName.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="profile-title" className="block text-sm font-medium text-[#171923]">
                  Role / Job Title
                </label>
                <Input
                  id="profile-title"
                  placeholder="e.g. Product Engineer"
                  disabled={loadingProfile}
                  className="mt-1.5"
                  {...profileForm.register('jobTitle')}
                />
              </div>

              <div>
                <label htmlFor="profile-bio" className="block text-sm font-medium text-[#171923]">
                  Bio
                </label>
                <Textarea
                  id="profile-bio"
                  placeholder="Brief summary of your focus areas"
                  disabled={loadingProfile}
                  className="mt-1.5"
                  {...profileForm.register('bio')}
                />
              </div>

              {profileError ? (
                <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-xs text-[#DC2626]">
                  {profileError}
                </p>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                {profileSaved ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A]">
                    <Check className="h-3.5 w-3.5" />
                    Profile saved
                  </span>
                ) : (
                  <span />
                )}
                <Button
                  type="submit"
                  disabled={loadingProfile || profileForm.formState.isSubmitting}
                >
                  {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications & Display</CardTitle>
            <CardDescription>
              Control how TaskFlow alerts you about assignments, mentions, and deadlines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {[
                {
                  id: 'pref-assigned',
                  label: 'Task assignments',
                  desc: 'Notify when you are assigned to a task',
                  checked: notifyTaskAssigned,
                  onChange: setNotifyTaskAssigned,
                },
                {
                  id: 'pref-comments',
                  label: 'Comments & @mentions',
                  desc: 'Notify when someone mentions you in a task discussion',
                  checked: notifyComments,
                  onChange: setNotifyComments,
                },
                {
                  id: 'pref-deadlines',
                  label: 'Deadline reminders',
                  desc: 'Surface approaching and overdue task alerts',
                  checked: notifyDeadlines,
                  onChange: setNotifyDeadlines,
                },
              ].map((item) => (
                <label
                  key={item.id}
                  htmlFor={item.id}
                  className="flex items-start justify-between gap-4 rounded-[10px] border border-[#E5E7EB] p-3.5 cursor-pointer hover:bg-[#F7F8FA]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#171923]">{item.label}</p>
                    <p className="text-xs text-[#6B7280]">{item.desc}</p>
                  </div>
                  <input
                    id={item.id}
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#E5E7EB] accent-[#635BDB]"
                  />
                </label>
              ))}
            </div>

            <div>
              <label htmlFor="pref-theme" className="block text-sm font-medium text-[#171923]">
                Interface Theme Preference
              </label>
              <Select
                id="pref-theme"
                value={themePreference}
                onChange={(e) =>
                  setThemePreference(e.target.value as 'light' | 'dark' | 'system')
                }
                className="mt-1.5"
              >
                <option value="light">Minimal White (Default)</option>
                <option value="system">Match System</option>
                <option value="dark">High Contrast Preference</option>
              </Select>
            </div>

            {prefsError ? (
              <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-xs text-[#DC2626]">
                {prefsError}
              </p>
            ) : null}

            <div className="flex items-center justify-between pt-2">
              {prefsSaved ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A]">
                  <Check className="h-3.5 w-3.5" />
                  Preferences saved
                </span>
              ) : (
                <span />
              )}
              <Button onClick={() => void handleSavePreferences()} disabled={savingPrefs || !user?.email}>
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeWorkspace ? (
        <Card>
          <CardHeader>
            <CardTitle>Workspace Settings · {activeWorkspace.name}</CardTitle>
            <CardDescription>
              {canManage
                ? 'Configure workspace metadata, default workflow stage, and viewer comment permissions.'
                : 'Read-only view of your current workspace settings. Workspace admins can modify these values.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={workspaceForm.handleSubmit(handleSaveWorkspace)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ws-name" className="block text-sm font-medium text-[#171923]">
                    Workspace Name
                  </label>
                  <Input
                    id="ws-name"
                    disabled={!canManage}
                    className="mt-1.5"
                    {...workspaceForm.register('name')}
                  />
                  {workspaceForm.formState.errors.name ? (
                    <p className="mt-1 text-xs text-[#DC2626]">
                      {workspaceForm.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="ws-status" className="block text-sm font-medium text-[#171923]">
                    Default New Task Status
                  </label>
                  <Select
                    id="ws-status"
                    disabled={!canManage}
                    className="mt-1.5"
                    {...workspaceForm.register('defaultTaskStatus')}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label htmlFor="ws-desc" className="block text-sm font-medium text-[#171923]">
                  Description
                </label>
                <Textarea
                  id="ws-desc"
                  disabled={!canManage}
                  className="mt-1.5"
                  {...workspaceForm.register('description')}
                />
              </div>

              <label
                htmlFor="ws-viewer-comments"
                className="flex items-center gap-3 rounded-[10px] border border-[#E5E7EB] p-3.5 cursor-pointer"
              >
                <input
                  id="ws-viewer-comments"
                  type="checkbox"
                  disabled={!canManage}
                  className="h-4 w-4 rounded border-[#E5E7EB] accent-[#635BDB]"
                  {...workspaceForm.register('allowViewerComments')}
                />
                <div>
                  <p className="text-sm font-medium text-[#171923]">Allow viewer comments</p>
                  <p className="text-xs text-[#6B7280]">
                    Let read-only workspace viewers participate in task comment threads.
                  </p>
                </div>
              </label>

              {wsError ? (
                <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3 py-2 text-xs text-[#DC2626]">
                  {wsError}
                </p>
              ) : null}

              {canManage ? (
                <div className="flex items-center justify-between pt-2">
                  {wsSaved ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A]">
                      <Check className="h-3.5 w-3.5" />
                      Workspace updated
                    </span>
                  ) : (
                    <span />
                  )}
                  <Button type="submit" disabled={workspaceForm.formState.isSubmitting}>
                    {workspaceForm.formState.isSubmitting ? 'Saving...' : 'Save Workspace Settings'}
                  </Button>
                </div>
              ) : null}
            </form>

            {isWorkspaceOwner ? (
              <div className="border-t border-[#E5E7EB] pt-6">
                <div className="flex flex-col gap-4 rounded-[12px] border border-[#DC2626]/30 bg-[#DC2626]/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#171923]">Delete Workspace</p>
                    <p className="mt-0.5 text-xs text-[#6B7280]">
                      Permanently remove this workspace reference and workspace record. Only the
                      workspace owner can perform this action.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Workspace
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${activeWorkspace?.name ?? ''}"? This action cannot be undone.`}
      >
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingWs}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            onClick={() => void handleDeleteWorkspace()}
            disabled={deletingWs}
          >
            {deletingWs ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
