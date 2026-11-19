import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Shield, Trash2, UserPlus } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Input } from '@/src/components/ui/Input';
import { useWorkspace } from '@/src/features/workspaces/WorkspaceContext';
import { apiRequest } from '@/src/lib/apiClient';
import { formatShortDate } from '@/src/lib/dateUtils';
import { firebaseConfig } from '@/src/lib/firebase';
import { BOOTSTRAP_ADMIN_EMAIL } from '@/src/lib/validation';
import {
  grantPlatformAdmin,
  listAllPlatformWorkspaces,
  listPlatformAdmins,
  revokePlatformAdmin,
} from '@/src/services/firestore/adminService';
import type { PlatformAdmin, Workspace } from '@/src/types/domain';

interface HealthReport {
  status: string;
  service: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: {
    provider: string;
    ready: boolean;
  };
}

export function AdminPage() {
  const { user } = useFirebase();
  const { isPlatformAdmin } = useWorkspace();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [admins, setAdmins] = useState<PlatformAdmin[]>([]);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [granting, setGranting] = useState(false);

  const fetchAdminSnapshot = useCallback(async () => {
    const [wsList, adminList, healthReport] = await Promise.all([
      listAllPlatformWorkspaces(),
      listPlatformAdmins(),
      apiRequest<HealthReport>('/api/v1/health'),
    ]);
    return { wsList, adminList, healthReport };
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!isPlatformAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const { wsList, adminList, healthReport } = await fetchAdminSnapshot();
      setWorkspaces(wsList);
      setAdmins(adminList);
      setHealth(healthReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load platform administration data');
    } finally {
      setLoading(false);
    }
  }, [isPlatformAdmin, fetchAdminSnapshot]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    let active = true;
    fetchAdminSnapshot()
      .then(({ wsList, adminList, healthReport }) => {
        if (!active) return;
        setWorkspaces(wsList);
        setAdmins(adminList);
        setHealth(healthReport);
        setError(null);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load platform administration data');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isPlatformAdmin, fetchAdminSnapshot]);

  if (!isPlatformAdmin) {
    return (
      <div className="py-10">
        <EmptyState
          title="Platform Administration Restricted"
          description="Only authorized platform administrators can access cross-tenant diagnostics and global workspace directories. Workspace admin roles do not grant platform-wide access."
          action={
            <Link to="/app">
              <Button>Return to Dashboard</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const handleGrantAdmin = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !newAdminUid.trim() || !newAdminEmail.trim()) return;
    setGranting(true);
    setError(null);
    try {
      await grantPlatformAdmin({
        uid: newAdminUid,
        email: newAdminEmail,
        grantedBy: user.uid,
      });
      setNewAdminUid('');
      setNewAdminEmail('');
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to grant platform admin role');
    } finally {
      setGranting(false);
    }
  };

  const handleRevokeAdmin = async (uid: string) => {
    setError(null);
    try {
      await revokePlatformAdmin(uid);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revoke platform admin');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">
            Platform Administration
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Global workspace directory, platform administrator registry, and API health telemetry.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadAdminData()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="rounded-[10px] border border-[#DC2626]/30 bg-[#DC2626]/5 px-4 py-3 text-xs text-[#DC2626]">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-[#6B7280]">Total Workspaces</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#171923]">
              {workspaces.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-[#6B7280]">Platform Admins</p>
            <p className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#635BDB]">
              {admins.length + 1}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-[#6B7280]">Backend Service</p>
            <p className="mt-2 text-sm font-semibold text-[#16A34A]">
              {health ? `${health.status.toUpperCase()} (${health.environment})` : 'Checking...'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-[#6B7280]">Firestore Project</p>
            <p className="mt-2 truncate text-xs font-mono text-[#171923]">
              {firebaseConfig.projectId}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform Workspaces Directory</CardTitle>
            <CardDescription>
              All workspaces registered in Firestore database {firebaseConfig.firestoreDatabaseId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workspaces.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No workspaces created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-xs font-medium text-[#6B7280]">
                      <th className="py-2.5 pr-4">Workspace</th>
                      <th className="py-2.5 px-3">Slug</th>
                      <th className="py-2.5 px-3">Owner UID</th>
                      <th className="py-2.5 pl-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {workspaces.map((ws) => (
                      <tr key={ws.id}>
                        <td className="py-3 pr-4 font-medium text-[#171923]">{ws.name}</td>
                        <td className="py-3 px-3 font-mono text-xs text-[#6B7280]">{ws.slug}</td>
                        <td className="py-3 px-3 font-mono text-xs text-[#6B7280]">
                          {ws.ownerId.slice(0, 12)}...
                        </td>
                        <td className="py-3 pl-3 text-xs font-mono text-[#6B7280]">
                          {formatShortDate(ws.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Administrators</CardTitle>
            <CardDescription>
              Bootstrap and delegated platform-level admin accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#171923]">
                <Shield className="h-3.5 w-3.5 text-[#635BDB]" />
                <span>Bootstrap Admin</span>
              </div>
              <p className="mt-1 font-mono text-xs text-[#6B7280]">{BOOTSTRAP_ADMIN_EMAIL}</p>
            </div>

            {admins.map((admin) => (
              <div
                key={admin.uid}
                className="flex items-center justify-between gap-2 rounded-[10px] border border-[#E5E7EB] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[#171923]">{admin.email}</p>
                  <p className="truncate font-mono text-[11px] text-[#6B7280]">{admin.uid}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Revoke admin ${admin.email}`}
                  onClick={() => void handleRevokeAdmin(admin.uid)}
                  className="text-[#6B7280] hover:text-[#DC2626] cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <form onSubmit={handleGrantAdmin} className="space-y-3 border-t border-[#E5E7EB] pt-4">
              <p className="text-xs font-semibold text-[#171923]">Grant Platform Admin</p>
              <Input
                value={newAdminUid}
                onChange={(e) => setNewAdminUid(e.target.value)}
                placeholder="Firebase User UID"
              />
              <Input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Verified Google email"
              />
              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={granting || !newAdminUid.trim() || !newAdminEmail.trim()}
              >
                <UserPlus className="h-4 w-4" />
                {granting ? 'Granting...' : 'Grant Admin Role'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
