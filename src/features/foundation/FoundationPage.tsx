import { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, LogIn, LogOut } from 'lucide-react';
import { useFirebase } from '@/src/app/providers';
import { TopNav } from '@/src/components/layout/TopNav';
import { Button } from '@/src/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { formatUptime } from '@/src/lib/utils';
import { useHealthQuery } from './useHealthQuery';

const ARCHITECTURE_PILLARS = [
  {
    index: '01',
    title: 'Modular Monolith Backend',
    description:
      'Express API under /api/v1 with Zod validation, centralized error handling, Helmet headers, CORS allowlist, and rate limiting.',
    meta: 'Node.js · Express · TypeScript',
  },
  {
    index: '02',
    title: 'Typed Frontend Shell',
    description:
      'Feature-sliced React architecture with TanStack Query for server state, Zustand for UI state, and React Router navigation.',
    meta: 'React 19 · Vite · Tailwind CSS',
  },
  {
    index: '03',
    title: 'Firebase Firestore & Auth',
    description:
      'Provisioned Cloud Firestore Enterprise database with Eight-Pillar security rules, PII split collections, and Google authentication.',
    meta: 'Firestore · Firebase Auth · Rules v2',
  },
  {
    index: '04',
    title: 'Verified Engineering Workflow',
    description:
      'ESLint security rules validation, Oxlint, TypeScript strict checks, Vitest + Supertest API tests, and architecture documentation.',
    meta: 'Vitest · Supertest · ESLint',
  },
];

const DELIVERY_ROADMAP = [
  { phase: 'Phase 1', title: 'Foundation & Firebase Database Connection', state: 'Implemented' },
  { phase: 'Phase 2', title: 'Authentication & Sessions', state: 'Planned' },
  { phase: 'Phase 3', title: 'Workspaces & Team Roles', state: 'Planned' },
  { phase: 'Phase 4', title: 'Project Management', state: 'Planned' },
  { phase: 'Phase 5', title: 'Task Management & Subtasks', state: 'Planned' },
  { phase: 'Phase 6', title: 'Interactive Kanban Board', state: 'Planned' },
  { phase: 'Phase 7', title: 'Comments, Files & Realtime Sync', state: 'Planned' },
  { phase: 'Phase 8', title: 'Calendar & Notifications', state: 'Planned' },
  { phase: 'Phase 9', title: 'Analytics & Administration', state: 'Planned' },
  { phase: 'Phase 10', title: 'Security & Production Audit', state: 'Planned' },
];

const COLOR_TOKENS = [
  { name: 'Primary Canvas', hex: '#FFFFFF', usage: 'Page & card surface' },
  { name: 'Secondary Surface', hex: '#F7F8FA', usage: 'Section bands & subtle panels' },
  { name: 'Primary Ink', hex: '#171923', usage: 'Headings & body copy' },
  { name: 'Secondary Ink', hex: '#6B7280', usage: 'Metadata & supporting copy' },
  { name: 'Primary Accent', hex: '#635BDB', usage: 'Primary CTAs & focus rings' },
  { name: 'Hairline Border', hex: '#E5E7EB', usage: '1px structural dividers' },
];

export function FoundationPage() {
  const connectivityRef = useRef<HTMLElement | null>(null);
  const { data, isLoading, isError, error, refetch, isFetching } = useHealthQuery();
  const {
    user,
    authReady,
    authLoading,
    authError,
    firestoreCheck,
    checkingFirestore,
    recheckFirestore,
    signInWithGoogle,
    signOut,
  } = useFirebase();

  const scrollToConnectivity = () => {
    connectivityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    void refetch();
    void recheckFirestore();
  };

  const handleRecheckAll = () => {
    void refetch();
    void recheckFirestore();
  };

  const isDbConfigured = Boolean(data?.database.ready);
  const isFirestoreOnline = Boolean(firestoreCheck?.online);

  return (
    <div id="top" className="min-h-screen bg-[#FFFFFF] text-[#171923]">
      <TopNav onVerifyClick={scrollToConnectivity} />

      <main>
        <section className="border-b border-[#E5E7EB] bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl"
            >
              <p className="text-sm font-medium text-[#635BDB]">
                Phase 1 Foundation · Firebase Firestore Connected
              </p>
              <h1 className="mt-4 text-[32px] sm:text-[44px] font-bold leading-[1.15] tracking-tight text-[#171923] [text-wrap:balance]">
                Structured project management engineered for clarity and speed.
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] sm:text-[16px] leading-relaxed text-[#6B7280]">
                TaskFlow pairs a clean full-stack foundation with a provisioned Firebase Firestore
                database and hardened security rules before feature modules roll out.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={scrollToConnectivity}>
                  Verify Firebase Connection
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <a
                  href="#architecture"
                  className="inline-flex h-11 items-center rounded-[10px] border border-[#E5E7EB] bg-white px-5 text-sm font-medium text-[#171923] transition-colors hover:bg-[#F7F8FA]"
                >
                  Inspect Architecture
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="architecture" className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="text-[22px] font-semibold tracking-tight text-[#171923]">
                Core Foundation Architecture
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                Each layer is isolated with explicit contracts so upcoming modules can scale without
                tight coupling.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {ARCHITECTURE_PILLARS.map((pillar) => (
                <Card key={pillar.index}>
                  <CardHeader>
                    <p className="text-xs font-mono font-medium text-[#635BDB]">
                      {pillar.index}.
                    </p>
                    <CardTitle className="mt-1.5">{pillar.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{pillar.description}</CardDescription>
                    <p className="mt-4 text-xs font-medium text-[#6B7280]">{pillar.meta}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="border-b border-[#E5E7EB] bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-[#171923]">
                  Delivery Roadmap
                </h2>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Phase 1 establishes the core platform infrastructure and Firebase Firestore connection.
                </p>
              </div>
              <p className="text-xs font-mono tabular-nums text-[#6B7280]">
                1 / 10 Phases Active
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-[12px] border border-[#E5E7EB]">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F7F8FA] text-xs font-medium text-[#6B7280]">
                    <th className="px-5 py-3">Phase</th>
                    <th className="px-5 py-3">Scope</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {DELIVERY_ROADMAP.map((item) => (
                    <tr key={item.phase} className="transition-colors hover:bg-[#F7F8FA]">
                      <td className="px-5 py-3 font-mono text-xs tabular-nums text-[#6B7280]">
                        {item.phase}
                      </td>
                      <td className="px-5 py-3 font-medium text-[#171923]">{item.title}</td>
                      <td
                        className={`px-5 py-3 text-right text-xs font-medium ${
                          item.state === 'Implemented' ? 'text-[#16A34A]' : 'text-[#6B7280]'
                        }`}
                      >
                        {item.state}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="design-system" className="border-b border-[#E5E7EB] bg-[#F7F8FA]">
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="text-[22px] font-semibold tracking-tight text-[#171923]">
                Minimal White Premium Design Tokens
              </h2>
              <p className="mt-2 text-sm text-[#6B7280]">
                Neutral canvas, 1px borders, focused indigo accent, and tabular numerals across metrics.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COLOR_TOKENS.map((token) => (
                <div
                  key={token.hex}
                  className="flex items-center gap-4 rounded-[12px] border border-[#E5E7EB] bg-white p-4"
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded-[8px] border border-[#E5E7EB]"
                    style={{ backgroundColor: token.hex }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#171923]">{token.name}</p>
                    <p className="text-xs font-mono text-[#6B7280]">{token.hex}</p>
                    <p className="mt-0.5 text-xs text-[#6B7280] truncate">{token.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="connectivity"
          ref={connectivityRef}
          className="bg-[#FFFFFF]"
        >
          <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-[#171923]">
                  Backend & Firebase Connectivity
                </h2>
                <p className="mt-1.5 text-sm text-[#6B7280]">
                  Verifies Express API (<code className="font-mono text-xs text-[#171923]">/api/v1/health</code>) and live Cloud Firestore reachability.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRecheckAll}
                disabled={isFetching || checkingFirestore}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching || checkingFirestore ? 'animate-spin' : ''}`}
                />
                {isFetching || checkingFirestore ? 'Checking...' : 'Re-run Check'}
              </Button>
            </div>

            <div className="mt-8 rounded-[12px] border border-[#E5E7EB] bg-white p-6">
              {isLoading ? (
                <div className="space-y-3" aria-busy="true" aria-label="Loading health check">
                  <div className="h-5 w-48 animate-pulse rounded bg-[#F7F8FA]" />
                  <div className="h-4 w-72 animate-pulse rounded bg-[#F7F8FA]" />
                </div>
              ) : isError ? (
                <div className="flex items-start gap-3 text-sm text-[#DC2626]">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Unable to reach backend health endpoint</p>
                    <p className="mt-1 text-[#6B7280]">
                      {error instanceof Error ? error.message : 'Request failed'}
                    </p>
                  </div>
                </div>
              ) : data ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-[#6B7280]">API Server</p>
                    <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Responding ({data.service})</span>
                    </div>
                    <p className="mt-1 text-xs font-mono tabular-nums text-[#6B7280]">
                      Uptime: {formatUptime(data.uptimeSeconds)} · {data.environment}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#6B7280]">Firestore Client Connection</p>
                    <div
                      className={`mt-1.5 flex items-center gap-2 text-sm font-semibold ${
                        checkingFirestore
                          ? 'text-[#6B7280]'
                          : isFirestoreOnline && isDbConfigured
                            ? 'text-[#16A34A]'
                            : 'text-[#D97706]'
                      }`}
                    >
                      {checkingFirestore ? (
                        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                      ) : isFirestoreOnline && isDbConfigured ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                      )}
                      <span>
                        {checkingFirestore
                          ? 'Testing Firestore...'
                          : isFirestoreOnline && isDbConfigured
                            ? 'Connected (Firestore)'
                            : 'Unavailable'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-mono text-[#6B7280] break-all">
                      {firestoreCheck?.error ??
                        data.database.lastError ??
                        `Project: ${data.database.projectId ?? 'n/a'}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[#6B7280]">Firebase Auth & Profile Sync</p>
                    {!authReady ? (
                      <p className="mt-1.5 text-sm text-[#6B7280]">Initializing auth...</p>
                    ) : user ? (
                      <div className="mt-1.5 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#16A34A]">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span className="truncate">{user.displayName || user.email}</span>
                        </div>
                        <p className="text-xs font-mono text-[#6B7280] truncate">{user.email}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void signOut()}
                          disabled={authLoading}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <Button
                          size="sm"
                          onClick={() => void signInWithGoogle()}
                          disabled={authLoading}
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          {authLoading ? 'Signing in...' : 'Sign in with Google'}
                        </Button>
                        {authError ? (
                          <p className="text-xs text-[#DC2626]">{authError}</p>
                        ) : (
                          <p className="text-xs text-[#6B7280]">
                            Verify Firestore authenticated profile write.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E5E7EB] bg-[#F7F8FA]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-xs text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-[#171923]">TaskFlow</p>
          <p>Phase 1 Foundation · Connected to Firebase Firestore</p>
        </div>
      </footer>
    </div>
  );
}
