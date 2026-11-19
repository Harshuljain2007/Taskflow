import { useEffect, useState, type ChangeEvent } from 'react';
import {
  CheckSquare,
  Download,
  Paperclip,
  Pencil,
  Plus,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { Textarea } from '@/src/components/ui/Textarea';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { formatRelativeDateTime } from '@/src/lib/dateUtils';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/src/lib/validation';
import {
  createComment,
  createSubtask,
  deleteComment,
  deleteSubtask,
  deleteTask,
  deleteTaskAttachment,
  subscribeAttachments,
  subscribeComments,
  subscribeSubtasks,
  toggleSubtask,
  updateComment,
  updateTask,
  uploadTaskAttachment,
} from '@/src/services/firestore/taskService';
import { useUiStore } from '@/src/stores/uiStore';
import type {
  AttachmentItem,
  CommentItem,
  SubtaskItem,
  TaskPriority,
  TaskStatus,
} from '@/src/types/domain';

export function TaskDetailDrawer() {
  const { user } = useFirebase();
  const { activeWorkspace, activeWorkspaceId, tasks, projects, members, canEdit, canManage } =
    useWorkspace();
  const selectedTaskId = useUiStore((s) => s.selectedTaskId);
  const setSelectedTaskId = useUiStore((s) => s.setSelectedTaskId);

  const task = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const taskId = task?.id ?? null;
  const project = task ? projects.find((p) => p.id === task.projectId) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [labelsInput, setLabelsInput] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!task) return;
    const timer = window.setTimeout(() => {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ?? '');
      setLabelsInput(task.labels.join(', '));
      setAssigneeIds(task.assigneeIds);
      setActionError(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [task]);

  useEffect(() => {
    if (!user || !activeWorkspaceId || !taskId) return;
    const unsubSubtasks = subscribeSubtasks(activeWorkspaceId, taskId, user.uid, setSubtasks);
    const unsubComments = subscribeComments(activeWorkspaceId, taskId, user.uid, setComments);
    const unsubAttachments = subscribeAttachments(
      activeWorkspaceId,
      taskId,
      user.uid,
      setAttachments,
    );
    return () => {
      unsubSubtasks();
      unsubComments();
      unsubAttachments();
    };
  }, [user, activeWorkspaceId, taskId]);

  if (!task || !activeWorkspaceId || !user) return null;

  const canDeleteTask = canManage || task.reporterId === user.uid;
  const canComment = canEdit || Boolean(activeWorkspace?.allowViewerComments);

  const handleSaveTask = async () => {
    if (!canEdit) return;
    setSaving(true);
    setActionError(null);
    try {
      await updateTask({
        workspaceId: activeWorkspaceId,
        taskId: task.id,
        previousAssigneeIds: task.assigneeIds,
        title: title.trim() || task.title,
        description,
        status,
        priority,
        assigneeIds,
        labels: labelsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        dueDate,
        position: task.position,
        actorId: user.uid,
        actorName: user.displayName || user.email?.split('@')[0] || 'Member',
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save task updates');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!canDeleteTask) return;
    await deleteTask(activeWorkspaceId, task.id);
    setSelectedTaskId(null);
  };

  const handleAddSubtask = async () => {
    if (!canEdit || !newSubtask.trim()) return;
    setActionError(null);
    try {
      await createSubtask({
        workspaceId: activeWorkspaceId,
        projectId: task.projectId,
        taskId: task.id,
        title: newSubtask,
        createdBy: user.uid,
        projectMemberIds: task.projectMemberIds,
      });
      setNewSubtask('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to add subtask');
    }
  };

  const extractMentionedUserIds = (text: string): string[] => {
    const lower = text.toLowerCase();
    return members
      .filter((m) => lower.includes(`@${m.displayName.toLowerCase()}`))
      .map((m) => m.userId)
      .slice(0, 10);
  };

  const handleAddComment = async () => {
    if (!canComment || !newComment.trim()) return;
    setActionError(null);
    try {
      await createComment({
        workspaceId: activeWorkspaceId,
        projectId: task.projectId,
        taskId: task.id,
        taskTitle: task.title,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Member',
        authorPhotoURL: user.photoURL,
        content: newComment,
        mentions: extractMentionedUserIds(newComment),
        projectMemberIds: task.projectMemberIds,
      });
      setNewComment('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to post comment');
    }
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    await updateComment({
      workspaceId: activeWorkspaceId,
      taskId: task.id,
      commentId,
      content: editingCommentText,
      mentions: extractMentionedUserIds(editingCommentText),
    });
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !canEdit) return;
    setUploadingFile(true);
    setActionError(null);
    try {
      await uploadTaskAttachment({
        workspaceId: activeWorkspaceId,
        projectId: task.projectId,
        taskId: task.id,
        file,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || user.email?.split('@')[0] || 'Member',
        projectMemberIds: task.projectMemberIds,
      });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setUploadingFile(false);
    }
  };

  const toggleAssignee = (uid: string) => {
    if (!canEdit) return;
    setAssigneeIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid].slice(0, 10),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        onClick={() => setSelectedTaskId(null)}
        className="fixed inset-0 bg-[#171923]/30 backdrop-blur-[1px]"
      />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-[#E5E7EB] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-mono font-semibold text-[#635BDB]">
              {project ? `${project.key} · ${project.name}` : 'Task Detail'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canDeleteTask ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-[#DC2626] hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                onClick={() => void handleDeleteTask()}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
            <button
              type="button"
              onClick={() => setSelectedTaskId(null)}
              aria-label="Close task detail"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#171923] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-7">
          {actionError ? (
            <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-3.5 py-2.5 text-xs text-[#DC2626]">
              {actionError}
            </p>
          ) : null}

          <div className="space-y-4">
            <div>
              <label htmlFor="detail-title" className="block text-xs font-medium text-[#6B7280]">
                Title
              </label>
              <Input
                id="detail-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit}
                className="mt-1 font-semibold text-base"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="detail-status" className="block text-xs font-medium text-[#6B7280]">
                  Status
                </label>
                <Select
                  id="detail-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  disabled={!canEdit}
                  className="mt-1"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  htmlFor="detail-priority"
                  className="block text-xs font-medium text-[#6B7280]"
                >
                  Priority
                </label>
                <Select
                  id="detail-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  disabled={!canEdit}
                  className="mt-1"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="detail-due" className="block text-xs font-medium text-[#6B7280]">
                  Due Date
                </label>
                <Input
                  id="detail-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!canEdit}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label htmlFor="detail-desc" className="block text-xs font-medium text-[#6B7280]">
                Description
              </label>
              <Textarea
                id="detail-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="detail-labels" className="block text-xs font-medium text-[#6B7280]">
                Labels
              </label>
              <Input
                id="detail-labels"
                value={labelsInput}
                onChange={(e) => setLabelsInput(e.target.value)}
                disabled={!canEdit}
                placeholder="Comma separated labels"
                className="mt-1"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-[#6B7280]">Assignees</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {members.map((member) => {
                  const selected = assigneeIds.includes(member.userId);
                  return (
                    <button
                      key={member.userId}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => toggleAssignee(member.userId)}
                      className={`inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#635BDB] bg-[#635BDB]/10 text-[#635BDB]'
                          : 'border-[#E5E7EB] bg-white text-[#6B7280]'
                      }`}
                    >
                      <Avatar name={member.displayName} photoURL={member.photoURL} size="xs" />
                      <span>{member.displayName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {canEdit ? (
              <div className="flex justify-end">
                <Button onClick={() => void handleSaveTask()} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Task Updates'}
                </Button>
              </div>
            ) : null}
          </div>

          {/* Subtasks */}
          <section className="border-t border-[#E5E7EB] pt-6">
            <h3 className="text-sm font-semibold text-[#171923]">
              Subtasks ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
            </h3>
            <div className="mt-3 space-y-2">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E5E7EB] px-3 py-2"
                >
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() =>
                      void toggleSubtask(activeWorkspaceId, task.id, sub.id, !sub.completed)
                    }
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-sm cursor-pointer"
                  >
                    {sub.completed ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-[#16A34A]" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-[#6B7280]" />
                    )}
                    <span
                      className={`truncate ${
                        sub.completed ? 'line-through text-[#6B7280]' : 'text-[#171923]'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </button>
                  {canEdit ? (
                    <button
                      type="button"
                      aria-label={`Delete subtask ${sub.title}`}
                      onClick={() => void deleteSubtask(activeWorkspaceId, task.id, sub.id)}
                      className="text-[#6B7280] hover:text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}

              {canEdit ? (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add a subtask..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleAddSubtask();
                      }
                    }}
                  />
                  <Button variant="secondary" onClick={() => void handleAddSubtask()}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          {/* Attachments */}
          <section className="border-t border-[#E5E7EB] pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#171923]">
                Attachments ({attachments.length})
              </h3>
              {canEdit ? (
                <label className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#171923] hover:bg-[#F7F8FA] cursor-pointer">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>{uploadingFile ? 'Uploading...' : 'Upload File (<= 200KB)'}</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf,.txt,.md,.json,.csv"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="sr-only"
                  />
                </label>
              ) : null}
            </div>

            <div className="mt-3 space-y-2">
              {attachments.length === 0 ? (
                <p className="text-xs text-[#6B7280]">No files attached yet.</p>
              ) : (
                attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-3 rounded-[10px] border border-[#E5E7EB] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-[#171923]">{att.fileName}</p>
                      <p className="text-[11px] font-mono text-[#6B7280]">
                        {Math.ceil(att.fileSize / 1024)} KB · {att.uploadedByName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={att.contentData}
                        download={att.fileName}
                        aria-label={`Download ${att.fileName}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#171923] hover:bg-[#F7F8FA]"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      {canManage || att.uploadedBy === user.uid ? (
                        <button
                          type="button"
                          aria-label={`Delete ${att.fileName}`}
                          onClick={() =>
                            void deleteTaskAttachment(activeWorkspaceId, task.id, att.id)
                          }
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Comments */}
          <section className="border-t border-[#E5E7EB] pt-6">
            <h3 className="text-sm font-semibold text-[#171923]">
              Comments ({comments.length})
            </h3>
            <div className="mt-3 space-y-3">
              {comments.map((comment) => {
                const isAuthor = comment.authorId === user.uid;
                const canDeleteComment = isAuthor || canManage;
                return (
                  <div
                    key={comment.id}
                    className="rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={comment.authorName}
                          photoURL={comment.authorPhotoURL}
                          size="xs"
                        />
                        <span className="text-xs font-semibold text-[#171923]">
                          {comment.authorName}
                        </span>
                        <span className="text-[11px] font-mono text-[#6B7280]">
                          {formatRelativeDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isAuthor ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.content);
                            }}
                            className="p-1 text-[#6B7280] hover:text-[#171923] cursor-pointer"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        ) : null}
                        {canDeleteComment ? (
                          <button
                            type="button"
                            onClick={() =>
                              void deleteComment(activeWorkspaceId, task.id, comment.id)
                            }
                            className="p-1 text-[#6B7280] hover:text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="bg-white"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void handleSaveCommentEdit(comment.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[#171923]">
                        {comment.content}
                      </p>
                    )}
                  </div>
                );
              })}

              {canComment ? (
                <div className="space-y-2 pt-2">
                  {members.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#6B7280]">
                      <span>Mention:</span>
                      {members.map((m) => (
                        <button
                          key={m.userId}
                          type="button"
                          onClick={() =>
                            setNewComment((prev) => `${prev}${prev ? ' ' : ''}@${m.displayName} `)
                          }
                          className="rounded px-1.5 py-0.5 bg-[#F7F8FA] border border-[#E5E7EB] hover:text-[#171923] cursor-pointer"
                        >
                          @{m.displayName}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment... Use @Name to mention teammates."
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => void handleAddComment()}
                      disabled={!newComment.trim()}
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
