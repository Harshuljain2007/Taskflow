import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { formatRelativeDateTime } from '@/src/lib/dateUtils';
import {
  markAllNotificationsRead,
  markNotificationRead,
} from '@/src/services/firestore/notificationService';
import { useUiStore } from '@/src/stores/uiStore';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';

export function NotificationMenu() {
  const { user } = useFirebase();
  const { notifications } = useWorkspace();
  const setSelectedTaskId = useUiStore((s) => s.setSelectedTaskId);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
  const unreadCount = unreadIds.length;

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#171923] transition-colors hover:bg-[#F7F8FA] cursor-pointer"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#635BDB] px-1 text-[10px] font-semibold tabular-nums text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-[12px] border border-[#E5E7EB] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
            <p className="text-sm font-semibold text-[#171923]">Notifications</p>
            {user && unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllNotificationsRead(user.uid, unreadIds)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#635BDB] hover:text-[#5148C9] cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#E5E7EB]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 20).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (user && !item.read) {
                      void markNotificationRead(user.uid, item.id);
                    }
                    if (item.entityType === 'task') {
                      setSelectedTaskId(item.entityId);
                    }
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#F7F8FA] cursor-pointer ${
                    item.read ? 'bg-white' : 'bg-[#635BDB]/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[#171923]">{item.title}</p>
                    <span className="shrink-0 text-[11px] font-mono tabular-nums text-[#6B7280]">
                      {formatRelativeDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{item.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
