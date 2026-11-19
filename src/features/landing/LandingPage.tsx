import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  FolderKanban,
  Layers,
  Lock,
  Menu,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebase } from '@/src/app/providers';
import { Button } from '@/src/components/ui/Button';

type PreviewTab = 'board' | 'list' | 'analytics';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const FEATURES = [
  {
    index: '01.',
    title: 'Multi-Tenant Workspaces & RBAC',
    description:
      'Isolate client engagements, product squads, or academic teams with Owner, Admin, Member, and Viewer permissions enforced directly by Firestore security rules.',
    icon: Lock,
  },
  {
    index: '02.',
    title: 'Fluid Kanban & List Views',
    description:
      'Switch between drag-and-drop Kanban columns and high-density filterable task tables with instant status, priority, and assignee updates.',
    icon: FolderKanban,
  },
  {
    index: '03.',
    title: 'Subtasks, @Mentions & Files',
    description:
      'Break work into actionable checklists, collaborate in threaded comments with teammate mentions, and attach project artifacts up to 200 KB.',
    icon: MessageSquare,
  },
  {
    index: '04.',
    title: 'Calendar Scheduling',
    description:
      'Inspect delivery milestones across Month, Week, and Day calendar views and create tasks directly on target dates.',
    icon: CalendarDays,
  },
  {
    index: '05.',
    title: 'Real-Time Notifications',
    description:
      'Stay synchronized with instant alerts for task assignments, comment mentions, and workspace invitations with unread badge tracking.',
    icon: Users,
  },
  {
    index: '06.',
    title: 'Velocity & Workload Analytics',
    description:
      'Measure completion ratios, priority mix, overdue exposure, and individual team workload using live Recharts visualizations.',
    icon: BarChart3,
  },
];

const WORKFLOW_STEPS = [
  {
    step: 'Step 01',
    title: 'Create your workspace',
    description:
      'Sign in with verified Google Auth, launch an isolated workspace in seconds, and invite teammates with granular role controls.',
  },
  {
    step: 'Step 02',
    title: 'Structure projects & tasks',
    description:
      'Organize initiatives with project keys, priorities, due dates, subtasks, and labels in either List or Kanban mode.',
  },
  {
    step: 'Step 03',
    title: 'Ship on schedule',
    description:
      'Monitor team capacity, clear blockers in comment threads, and track milestone progress across Calendar and Analytics.',
  },
];

const BENEFITS = [
  'Zero clutter interface built for sustained focus',
  'Real-time Firestore synchronization across every active tab',
  'Strict tenant isolation backed by automated security rules',
  'Built-in reduced-motion and keyboard accessibility support',
];

const DEMO_TESTIMONIALS = [
  {
    quote:
      'Replacing scattered spreadsheets with TaskFlow cut our weekly sprint check-in time in half while keeping every deadline visible.',
    author: 'Maya Lin',
    role: 'Engineering Lead · Demo Sample',
  },
  {
    quote:
      'Having Kanban, Calendar, and role-based client viewer access in one calm workspace made agency handoffs effortless.',
    author: 'Daniel Okafor',
    role: 'Studio Director · Demo Sample',
  },
  {
    quote:
      'Our capstone team stayed aligned from kickoff to final defense without getting lost in bloated enterprise menus.',
    author: 'Priya Nair',
    role: 'Graduate Researcher · Demo Sample',
  },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '$0',
    period: 'Free tier',
    description: 'Ideal for students, freelancers, and personal project tracking.',
    features: [
      'Up to 3 active workspaces',
      'Unlimited tasks & subtasks',
      'Kanban, List, and Calendar views',
      'Google Sign-In authentication',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Team Pro',
    price: '$12',
    period: 'per member / month (Demo plan)',
    description: 'Designed for growing product teams, startups, and client agencies.',
    features: [
      'Unlimited workspaces & projects',
      'Role-based invitations (Admin, Member, Viewer)',
      'Real-time @mentions & file attachments',
      'Full workload & completion analytics',
    ],
    cta: 'Launch Team Workspace',
    highlighted: true,
  },
  {
    name: 'Organization',
    price: 'Custom',
    period: 'Volume licensing',
    description: 'For multi-squad organizations requiring centralized governance.',
    features: [
      'Dedicated platform administration directory',
      'Custom Firebase project & region deployment',
      'Audit activity logs across workspaces',
      'Priority onboarding support',
    ],
    cta: 'Create Account',
    highlighted: false,
  },
];

const FAQS = [
  {
    q: 'How is workspace data isolated between teams?',
    a: 'Every workspace, project, task, comment, and attachment is scoped under tenant collections in Cloud Firestore and verified by server-side security rules checking explicit workspace membership.',
  },
  {
    q: 'What roles are supported inside a workspace?',
    a: 'TaskFlow supports Owner, Admin, Member, and Viewer roles. Viewers have read-only access (with optional comment participation), Members can create and update tasks, and Admins/Owners manage members and workspace settings.',
  },
  {
    q: 'Can I switch between Kanban, List, and Calendar views?',
    a: 'Yes. Every task created in a project automatically appears across the Tasks table, drag-and-drop Kanban board, Calendar schedule, Dashboard KPIs, and Analytics charts.',
  },
  {
    q: 'Does TaskFlow require a paid subscription to try?',
    a: 'No. You can sign in immediately with Google, create a workspace, invite teammates, and test every module free of charge.',
  },
];

const PREVIEW_COLUMNS = [
  {
    title: 'To Do',
    items: [
      { key: 'TF-14', title: 'Finalize Q2 release checklist', priority: 'High', due: 'May 18' },
      { key: 'TF-19', title: 'Audit workspace invitation flow', priority: 'Medium', due: 'May 21' },
    ],
  },
  {
    title: 'In Progress',
    items: [
      { key: 'TF-11', title: 'Ship Kanban drag-and-drop persistence', priority: 'Urgent', due: 'May 16' },
      { key: 'TF-15', title: 'Add @mention notifications', priority: 'High', due: 'May 19' },
    ],
  },
  {
    title: 'Done',
    items: [
      { key: 'TF-08', title: 'Deploy Firestore tenant security rules', priority: 'High', due: 'May 14' },
    ],
  },
];

export function LandingPage() {
  const { user } = useFirebase();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('board');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div id="top" className="min-h-screen bg-[#FFFFFF] text-[#171923]">
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#171923] whitespace-nowrap shrink-0"
          >
            <Layers className="h-5 w-5 text-[#635BDB]" />
            <span>TaskFlow</span>
          </Link>

          <nav
            aria-label="Marketing Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6B7280]"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap shrink-0 transition-colors hover:text-[#171923]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            {user ? (
              <Link to="/app">
                <Button size="sm">
                  Open Workspace
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E5E7EB] text-[#171923] md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-[#E5E7EB] bg-white px-6 py-4 md:hidden">
            <nav aria-label="Mobile Navigation" className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-sm font-medium text-[#171923]"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#E5E7EB]">
                {user ? (
                  <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Open Workspace</Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      {/* 2. Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-14 sm:pt-24 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-[#635BDB]">
            Project Management & Team Collaboration
          </p>
          <h1 className="mt-4 text-[34px] sm:text-[44px] font-bold leading-[1.12] tracking-tight text-[#171923]">
            Organize projects, align teammates, and ship work on time.
          </h1>
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#6B7280]">
            TaskFlow brings structured workspaces, drag-and-drop Kanban boards, deadline calendars,
            and real-time team analytics together inside one minimal, high-clarity platform.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={user ? '/app' : '/register'}>
              <Button size="lg">
                {user ? 'Go to Dashboard' : 'Start Free Workspace'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#preview">
              <Button variant="outline" size="lg">
                Explore Live Preview
              </Button>
            </a>
          </div>

          <p className="mt-5 text-xs text-[#6B7280]">
            Real-time Cloud Firestore persistence · Role-based access control · No credit card
            required
          </p>
        </motion.div>
      </section>

      {/* 3. Interactive Product Preview */}
      <section id="preview" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FA] p-3 sm:p-5">
          <div className="rounded-[12px] border border-[#E5E7EB] bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-3.5">
              <div>
                <p className="text-sm font-semibold text-[#171923]">
                  Product Core · Sprint Workspace Preview
                </p>
                <p className="text-xs text-[#6B7280]">
                  Interactive sample view · Switch modes to inspect workflows
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] p-1">
                {(
                  [
                    { id: 'board', label: 'Kanban' },
                    { id: 'list', label: 'Task List' },
                    { id: 'analytics', label: 'Analytics' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewTab(tab.id)}
                    className={`rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      previewTab === tab.id
                        ? 'bg-white text-[#171923] shadow-xs'
                        : 'text-[#6B7280] hover:text-[#171923]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {previewTab === 'board' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {PREVIEW_COLUMNS.map((col) => (
                    <div
                      key={col.title}
                      className="rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-[#171923]">
                        <span>{col.title}</span>
                        <span className="font-mono text-[#6B7280]">{col.items.length}</span>
                      </div>
                      {col.items.map((item) => (
                        <div
                          key={item.key}
                          className="rounded-[10px] border border-[#E5E7EB] bg-white p-3"
                        >
                          <p className="text-[11px] font-mono text-[#635BDB]">{item.key}</p>
                          <p className="mt-1 text-sm font-medium text-[#171923]">{item.title}</p>
                          <p className="mt-2 text-xs text-[#6B7280]">
                            {item.priority} · Due {item.due}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : null}

              {previewTab === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] text-xs font-medium text-[#6B7280]">
                        <th className="py-2 pr-4">Key</th>
                        <th className="py-2 px-3">Task</th>
                        <th className="py-2 px-3">Stage</th>
                        <th className="py-2 px-3">Priority</th>
                        <th className="py-2 pl-3">Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {PREVIEW_COLUMNS.flatMap((col) =>
                        col.items.map((item) => (
                          <tr key={item.key}>
                            <td className="py-2.5 pr-4 font-mono text-xs text-[#635BDB]">
                              {item.key}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#171923]">{item.title}</td>
                            <td className="py-2.5 px-3 text-xs text-[#6B7280]">{col.title}</td>
                            <td className="py-2.5 px-3 text-xs text-[#171923]">{item.priority}</td>
                            <td className="py-2.5 pl-3 font-mono text-xs text-[#6B7280]">
                              {item.due}
                            </td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {previewTab === 'analytics' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Active Tasks', value: '5', tone: 'text-[#171923]' },
                    { label: 'Completion Rate', value: '68%', tone: 'text-[#16A34A]' },
                    { label: 'In Progress', value: '2', tone: 'text-[#635BDB]' },
                    { label: 'On-Schedule Rate', value: '100%', tone: 'text-[#3B82F6]' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[10px] border border-[#E5E7EB] bg-[#F7F8FA] p-4"
                    >
                      <p className="text-xs font-medium text-[#6B7280]">{stat.label}</p>
                      <p className={`mt-2 text-2xl font-bold font-mono tabular-nums ${stat.tone}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features */}
      <section id="features" className="border-t border-[#E5E7EB] bg-[#F7F8FA] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">
              Everything teams need to execute cleanly
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Built with a calm, distraction-free Minimal White interface and strict tenant
              boundaries.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.index}
                  className="rounded-[12px] border border-[#E5E7EB] bg-white p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[#635BDB]">
                      {feat.index}
                    </span>
                    <Icon className="h-4 w-4 text-[#6B7280]" />
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold text-[#171923]">{feat.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. How it works & 6. Benefits */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 space-y-16">
        <div>
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">How TaskFlow works</h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            Go from blank slate to synchronized team delivery in three simple steps.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {WORKFLOW_STEPS.map((item) => (
              <div key={item.step} className="rounded-[12px] border border-[#E5E7EB] bg-white p-6">
                <p className="font-mono text-xs font-semibold text-[#635BDB]">{item.step}</p>
                <h3 className="mt-3 text-[17px] font-semibold text-[#171923]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FA] p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="text-[22px] font-bold tracking-tight text-[#171923]">
              Built for speed, clarity, and accountability
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              Whether you are coordinating a software sprint, client deliverables, or an engineering
              capstone, TaskFlow eliminates status-meeting overhead.
            </p>
          </div>
          <ul className="space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-[#171923]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. Testimonials (Explicitly Labeled Demo Content) */}
      <section className="border-t border-[#E5E7EB] bg-[#F7F8FA] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">
                Team Workflows in Practice
              </h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Illustrative customer stories representing typical TaskFlow team setups (Demo
                Content).
              </p>
            </div>
            <span className="text-xs font-mono text-[#6B7280]">
              DEMO CONTENT · ILLUSTRATIVE QUOTES
            </span>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {DEMO_TESTIMONIALS.map((item) => (
              <blockquote
                key={item.author}
                className="flex flex-col justify-between rounded-[12px] border border-[#E5E7EB] bg-white p-6"
              >
                <p className="text-sm leading-relaxed text-[#171923]">“{item.quote}”</p>
                <footer className="mt-5 border-t border-[#E5E7EB] pt-3">
                  <p className="text-xs font-semibold text-[#171923]">{item.author}</p>
                  <p className="text-[11px] text-[#6B7280]">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            Start free today with full workspace capabilities. Sample tiers shown below illustrate
            SaaS packaging.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col justify-between rounded-[12px] border p-6 ${
                tier.highlighted
                  ? 'border-[#635BDB] bg-white shadow-sm'
                  : 'border-[#E5E7EB] bg-white'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-[#171923]">{tier.name}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tabular-nums text-[#171923]">
                    {tier.price}
                  </span>
                  <span className="text-xs text-[#6B7280]">{tier.period}</span>
                </div>
                <p className="mt-3 text-sm text-[#6B7280]">{tier.description}</p>

                <ul className="mt-6 space-y-2.5 border-t border-[#E5E7EB] pt-5">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-[#171923]">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#635BDB]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-2">
                <Link to={user ? '/app' : '/register'}>
                  <Button
                    variant={tier.highlighted ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    {user ? 'Open Workspace' : tier.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="border-t border-[#E5E7EB] bg-[#F7F8FA] py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-[26px] font-bold tracking-tight text-[#171923]">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-[12px] border border-[#E5E7EB] bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[#171923] cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-[#E5E7EB] px-5 py-4 text-sm leading-relaxed text-[#6B7280]">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-[#E5E7EB] bg-white py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-[#171923]">TaskFlow</p>
            <p className="mt-1 text-xs text-[#6B7280]">
              Minimal White Premium Project Management & Team Collaboration Platform.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#6B7280]">
            <a href="#features" className="hover:text-[#171923]">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#171923]">
              How it works
            </a>
            <a href="#pricing" className="hover:text-[#171923]">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#171923]">
              FAQ
            </a>
            <Link to="/login" className="hover:text-[#171923]">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
