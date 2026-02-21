import { useNavigate } from 'react-router-dom';
import {
  Truck, Shield, BarChart3, Users, ArrowRight, CheckCircle2,
  AlertTriangle, Eye, DollarSign, Zap, Wrench, Activity, Lock,
  Database, GitBranch, ChevronRight, Gauge, FileCheck, MoveRight
} from 'lucide-react';

/* ─────────── Tiny Helpers ─────────── */
const Section = ({ children, className = '', id }) => (
  <section id={id} className={`px-6 md:px-12 lg:px-20 xl:px-32 ${className}`}>{children}</section>
);

const Badge = ({ children }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
    {children}
  </span>
);

/* ═══════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden">

      {/* ───── Navbar ───── */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6 md:px-12 lg:px-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200">
              <Truck size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">FleetCommand</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#problem" className="hover:text-slate-900 transition-colors">Problem</a>
            <a href="#solution" className="hover:text-slate-900 transition-colors">Solution</a>
            <a href="#flow" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-slate-900 transition-colors">Roles</a>
            <a href="#why" className="hover:text-slate-900 transition-colors">Why This Wins</a>
          </div>
          <button onClick={() => navigate('/login')}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 hover:shadow-md hover:shadow-blue-200">
            Sign In <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <Section className="pt-20 pb-24 lg:pt-28 lg:pb-32 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f910_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f910_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <Badge><Zap size={12} /> Built for Hackathon Excellence</Badge>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight text-slate-900">
              Digitizing Fleet Operations with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Real-Time Intelligence
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-500 max-w-xl">
              Replace inefficient manual logbooks with a centralized, rule-based fleet command hub.
              Optimize vehicle lifecycles, enforce driver safety, and track every dollar — all from one dashboard.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={() => navigate('/login')}
                className="group flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-0.5">
                Launch Command Center
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => { const el = document.getElementById('roles'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                className="group flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all hover:-translate-y-0.5">
                View Role Demo
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Social proof strip */}
            <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> 4 RBAC Roles</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> 7 Relational Tables</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> Atomic State Machine</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> CSV &amp; PDF Export</span>
            </div>
          </div>

          {/* Right — Glassmorphism Dashboard Preview */}
          <div className="flex justify-center lg:justify-end">
            <div className="animate-float w-full max-w-md"
              style={{ perspective: '800px' }}>
              <div className="relative rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl shadow-[0_8px_40px_rgba(59,130,246,0.12),0_2px_12px_rgba(0,0,0,0.04)] p-5 sm:p-6"
                style={{ transform: 'perspective(800px) rotateY(-6deg)' }}>

                {/* Header bar */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <Truck size={13} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 tracking-tight">Command Center</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    Live Data
                  </span>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label: 'Active Fleet',      value: '8',   icon: Truck,    bg: 'bg-blue-50',    iconColor: 'text-blue-500',   valueColor: 'text-blue-700' },
                    { label: 'Utilization Rate',   value: '82%', icon: Activity, bg: 'bg-emerald-50', iconColor: 'text-emerald-500', valueColor: 'text-emerald-700' },
                    { label: 'Open Maintenance',   value: '1',   icon: Wrench,   bg: 'bg-amber-50',   iconColor: 'text-amber-500',   valueColor: 'text-amber-700' },
                    { label: 'Pending Cargo',      value: '2',   icon: BarChart3, bg: 'bg-purple-50', iconColor: 'text-purple-500',  valueColor: 'text-purple-700' },
                  ].map(({ label, value, icon: KIcon, bg, iconColor, valueColor }) => (
                    <div key={label} className="rounded-xl bg-white/80 border border-slate-100 p-3 flex items-center gap-2.5 shadow-sm">
                      <div className={`w-8 h-8 rounded-lg ${bg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
                        <KIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-base font-bold leading-none ${valueColor}`}>{value}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Utilization bar */}
                <div className="rounded-xl bg-white/80 border border-slate-100 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fleet Utilization</span>
                    <span className="text-xs font-bold text-emerald-600">82%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-1000" style={{ width: '82%' }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[9px] text-slate-400">
                    <span>6 on trip &middot; 1 in shop</span>
                    <span>1 available</span>
                  </div>
                </div>

                {/* Decorative dots — window chrome feel */}
                <div className="absolute top-2.5 left-5 flex gap-1">
                  <span className="w-[5px] h-[5px] rounded-full bg-red-300/60" />
                  <span className="w-[5px] h-[5px] rounded-full bg-amber-300/60" />
                  <span className="w-[5px] h-[5px] rounded-full bg-emerald-300/60" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ───── Problem ───── */}
      <Section id="problem" className="py-20 lg:py-28 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <Badge><AlertTriangle size={12} /> The Problem</Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Manual Fleet Management Is Broken
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              Traditional fleet operations rely on spreadsheets, paper logs, and disconnected tools — leading to costly errors and zero visibility.
            </p>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: FileCheck,
                title: 'Error-Prone Manual Tracking',
                desc: 'Paper logbooks and spreadsheets make it impossible to maintain accurate, up-to-date vehicle and trip records across a growing fleet.',
                accent: 'red',
              },
              {
                icon: Eye,
                title: 'No Driver Compliance Visibility',
                desc: 'Expired licenses, safety violations, and unmonitored driver behavior create liability and go unnoticed until it\'s too late.',
                accent: 'amber',
              },
              {
                icon: DollarSign,
                title: 'Poor Financial Oversight',
                desc: 'Fuel costs, maintenance expenses, and per-vehicle ROI are scattered across systems — making budget decisions guesswork.',
                accent: 'orange',
              },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div key={title}
                className="group bg-white rounded-2xl border border-slate-200 p-7 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5
                  ${accent === 'red' ? 'bg-red-50 text-red-500' : accent === 'amber' ? 'bg-amber-50 text-amber-500' : 'bg-orange-50 text-orange-500'}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── Solution ───── */}
      <Section id="solution" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <Badge><Zap size={12} /> Our Solution</Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Intelligent Fleet Command, End to End
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              A unified platform that enforces business rules at every transition, surfaces real-time insights, and keeps your fleet profitable.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Smart Dispatch Engine',
                desc: 'Validates cargo capacity, license expiry, and driver availability before every trip assignment.',
                color: 'from-blue-500 to-blue-600',
                bg: 'bg-blue-50',
              },
              {
                icon: Wrench,
                title: 'Auto Maintenance Sync',
                desc: 'Vehicle status atomically transitions to "In Shop" on log creation and back to "Available" on resolution.',
                color: 'from-emerald-500 to-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                icon: Activity,
                title: 'Real-Time Utilization',
                desc: 'Live fleet utilization dashboards, pending cargo tracking, and driver duty status at a glance.',
                color: 'from-purple-500 to-purple-600',
                bg: 'bg-purple-50',
              },
              {
                icon: BarChart3,
                title: 'Financial Analytics & ROI',
                desc: 'Per-vehicle cost breakdown, monthly revenue vs. expenses, and one-click CSV/PDF reporting.',
                color: 'from-amber-500 to-amber-600',
                bg: 'bg-amber-50',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title}
                className="group relative bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                  <Icon size={20} className={`bg-gradient-to-br ${color} bg-clip-text`} style={{ color: 'inherit' }} />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── Role-Based System ───── */}
      <Section id="roles" className="py-20 lg:py-28 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <Badge><Lock size={12} /> Role-Based Access</Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Four Roles, Zero Overlap
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              Every user sees only what they need. Strict RBAC enforced at both API middleware and UI routing layers.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                role: 'Fleet Manager',
                email: 'fleet@demo.com',
                desc: 'Full vehicle registry control, maintenance oversight, and operational analytics access.',
                accent: 'blue',
              },
              {
                icon: GitBranch,
                role: 'Dispatcher',
                email: 'dispatch@demo.com',
                desc: 'Trip lifecycle ownership — create, dispatch, complete, or cancel with automatic state transitions.',
                accent: 'emerald',
              },
              {
                icon: Shield,
                role: 'Safety Officer',
                email: 'safety@demo.com',
                desc: 'Driver management with safety scores, license monitoring, and compliance enforcement.',
                accent: 'purple',
              },
              {
                icon: DollarSign,
                role: 'Financial Analyst',
                email: 'finance@demo.com',
                desc: 'Fuel logs, expense tracking, ROI analytics, and exportable financial reports.',
                accent: 'amber',
              },
            ].map(({ icon: Icon, role, email, desc, accent }) => {
              const colors = {
                blue:    { card: 'hover:border-blue-200',    icon: 'bg-blue-50 text-blue-600',    badge: 'bg-blue-50 text-blue-600 border-blue-100' },
                emerald: { card: 'hover:border-emerald-200', icon: 'bg-emerald-50 text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                purple:  { card: 'hover:border-purple-200',  icon: 'bg-purple-50 text-purple-600',  badge: 'bg-purple-50 text-purple-600 border-purple-100' },
                amber:   { card: 'hover:border-amber-200',   icon: 'bg-amber-50 text-amber-600',   badge: 'bg-amber-50 text-amber-600 border-amber-100' },
              }[accent];
              return (
                <div key={role}
                  className={`group bg-white rounded-2xl border border-slate-200 p-6 ${colors.card} hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 hover:-translate-y-1`}>
                  <div className={`w-11 h-11 rounded-xl ${colors.icon} flex items-center justify-center mb-4`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{role}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
                  <div className={`mt-4 inline-flex items-center text-xs font-mono px-2.5 py-1 rounded-md border ${colors.badge}`}>
                    {email}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            All demo accounts use password: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">password123</span>
          </p>
        </div>
      </Section>

      {/* ───── How FleetCommand Works — Animated Flow ───── */}
      <Section id="flow" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <Badge><GitBranch size={12} /> System Architecture</Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              How FleetCommand Works
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              Four specialized roles collaborate through a unified state machine — every action triggers atomic, validated transitions across the entire system.
            </p>
          </div>

          {/* Flow Diagram */}
          <div className="mt-16 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0">
            {[
              {
                icon: Truck,
                role: 'Fleet Manager',
                line: 'Registers vehicles & schedules maintenance',
                accent: 'blue',
                animClass: 'animate-flow-in-1',
              },
              {
                icon: GitBranch,
                role: 'Dispatcher',
                line: 'Assigns trips with capacity & license checks',
                accent: 'emerald',
                animClass: 'animate-flow-in-2',
              },
              {
                icon: Shield,
                role: 'Driver',
                line: 'Executes trips under safety compliance',
                accent: 'purple',
                animClass: 'animate-flow-in-3',
              },
              {
                icon: DollarSign,
                role: 'Financial Analyst',
                line: 'Tracks fuel, expenses & generates reports',
                accent: 'amber',
                animClass: 'animate-flow-in-4',
              },
            ].map(({ icon: Icon, role, line, accent, animClass }, idx) => {
              const accentMap = {
                blue:    { border: 'border-blue-200',    bg: 'bg-blue-50',    text: 'text-blue-600',    ring: 'group-hover:shadow-blue-100' },
                emerald: { border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'group-hover:shadow-emerald-100' },
                purple:  { border: 'border-purple-200',  bg: 'bg-purple-50',  text: 'text-purple-600',  ring: 'group-hover:shadow-purple-100' },
                amber:   { border: 'border-amber-200',   bg: 'bg-amber-50',   text: 'text-amber-600',   ring: 'group-hover:shadow-amber-100' },
              }[accent];
              return (
                <div key={role} className="flex items-center gap-4 lg:gap-0">
                  {/* Card */}
                  <div className={`${animClass} group flex flex-col items-center text-center w-48 sm:w-52`}>
                    <div className={`w-14 h-14 rounded-2xl ${accentMap.bg} ${accentMap.text} flex items-center justify-center mb-3 border ${accentMap.border} group-hover:shadow-lg ${accentMap.ring} transition-all duration-300 group-hover:-translate-y-1`}>
                      <Icon size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">{role}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[180px]">{line}</p>
                  </div>
                  {/* Animated Arrow (not after last) */}
                  {idx < 3 && (
                    <div className={`hidden lg:flex items-center mx-3 ${idx === 0 ? 'animate-arrow-1' : idx === 1 ? 'animate-arrow-2' : 'animate-arrow-3'}`}>
                      <div className="w-10 h-px bg-gradient-to-r from-slate-300 to-slate-200" />
                      <MoveRight size={16} className="text-slate-300 -ml-1" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Caption */}
          <div className="mt-14 flex justify-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm">
              <Database size={16} className="text-blue-400 flex-shrink-0" />
              <span className="leading-snug">
                <span className="font-semibold">Atomic State Machine</span>{' '}
                <span className="text-slate-300">ensures synchronized updates across trips, vehicles, and drivers in a single transaction.</span>
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* ───── Why This Wins ───── */}
      <Section id="why" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <Badge><Gauge size={12} /> Hackathon Edge</Badge>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Why This Wins
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              This isn't a CRUD demo. It's a rule-driven lifecycle management system with production-grade architecture decisions.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: GitBranch,
                title: 'Atomic State Transitions',
                desc: 'Trip dispatch atomically updates vehicle, driver, and trip status in a single DB transaction. No partial states.',
              },
              {
                icon: Lock,
                title: 'Role-Based Access Control',
                desc: 'JWT-embedded roles enforced at API middleware layer. Frontend routes mirror backend permissions exactly.',
              },
              {
                icon: Activity,
                title: 'Real-Time Analytics',
                desc: 'Computed KPIs (utilization rate, safety scores, ROI) derived live from relational data — not cached snapshots.',
              },
              {
                icon: Database,
                title: 'Relational Integrity',
                desc: '7 normalized tables with foreign keys, cascade rules, and referential constraints enforced at the ORM level.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title}
                className="relative bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ───── Tech Stack Ribbon ───── */}
      <div className="border-y border-slate-100 bg-slate-50 py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">Built With</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-medium text-slate-500">
            {['React 18', 'FastAPI', 'SQLAlchemy', 'TailwindCSS', 'Recharts', 'JWT Auth', 'Pydantic v2', 'SQLite'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ───── Final CTA ───── */}
      <Section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Ready to See It in Action?
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            Log in with any demo role and explore the full system — smart dispatch, live analytics, and automated maintenance tracking.
          </p>
          <button onClick={() => navigate('/login')}
            className="group mt-10 inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 hover:-translate-y-0.5">
            Launch FleetCommand
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </Section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Truck size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-700">FleetCommand</span>
          </div>
          <p className="text-xs text-slate-400">
            Hackathon 2026 &middot; Fleet Management ERP &middot; Built with architecture-first thinking
          </p>
        </div>
      </footer>
    </div>
  );
}
