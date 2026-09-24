import React, { useState } from 'react';
import { ArdhnarishwarLogo } from '../components/common/ArdhnarishwarLogo';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  Video, 
  Users, 
  Building2, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Cpu, 
  Lock, 
  BarChart3, 
  Clock, 
  FileText, 
  Award, 
  ChevronRight, 
  ChevronDown, 
  Star, 
  Layers, 
  Play, 
  Globe, 
  Headphones, 
  HelpCircle,
  TrendingUp,
  Sliders,
  Check,
  X
} from 'lucide-react';

interface LandingPageProps {
  onNavigateAuth: (tab?: 'admin' | 'candidate' | 'company_register' | 'employee_register') => void;
  onNavigateSuperAdmin?: () => void;
  onLaunchCandidateChamber: () => void;
  onOpenDemoChamber: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateAuth,
  onNavigateSuperAdmin,
  onLaunchCandidateChamber,
  onOpenDemoChamber
}) => {
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'recruiter' | 'candidate' | 'ai'>('recruiter');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const stats = [
    { value: '88%', label: 'Reduction in Time-to-Hire', icon: Zap },
    { value: '0 Key API', label: '100% In-House AI Zero API Costs', icon: Cpu },
    { value: '99.9%', label: 'Zero-Bias Scoring Consistency', icon: Award },
    { value: '24/7', label: 'Autonomous On-Demand Interviews', icon: Clock },
  ];

  const features = [
    {
      icon: Bot,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      title: 'Autonomous Real-Time AI Interviews',
      description: 'Dynamic conversational AI conducts technical, behavioral, and situational interviews with real-time speech recognition and voice synthesis.'
    },
    {
      icon: Cpu,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      title: 'Adaptive Follow-Up Questions',
      description: 'Intelligent multi-turn AI analyzes candidate responses on the fly and generates contextual follow-up inquiries to test deep engineering principles.'
    },
    {
      icon: Award,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'Objective Zero-Bias Scoring',
      description: 'Vector-space similarity and concept graph analysis evaluate technical depth, problem-solving, and communication without demographic bias.'
    },
    {
      icon: FileText,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      title: 'Semantic AI Resume Screener',
      description: 'Instant parsing and rank-matching of candidate resumes against job descriptions with missing skill identification and suggested interview rounds.'
    },
    {
      icon: Video,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10 border-teal-500/20',
      title: 'Live Panel Video Conference Rooms',
      description: 'Built-in Zoom-style multi-party conference chambers with interactive whiteboard, synchronized evaluation rubrics, and chat.'
    },
    {
      icon: Lock,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      title: 'Enterprise Multi-Tenant Security',
      description: 'Strict cryptographic JWT authentication, RBAC authorization, per-company data isolation, and immutable tamper-proof audit logging.'
    },
  ];

  const faqs = [
    {
      q: 'How does the Autonomous AI Interview Chamber evaluate candidates?',
      a: 'The chamber uses in-house NLP vectorization, key concept graph extraction, speech fluency pacing, and STAR behavioral logic to evaluate answers against benchmark rubrics in real time.'
    },
    {
      q: 'Are any third-party external API keys required to run the AI engine?',
      a: 'No. The platform features a 100% self-contained modular AI scoring pipeline that operates zero external API dependencies, ensuring zero ongoing API bills, complete data privacy, and sub-100ms response times.'
    },
    {
      q: 'How is tenant and company data isolation guaranteed?',
      a: 'Ardhnarishwar enforces zero-trust tenant validation at both the database and REST/WebSocket API layer. Every query is scoped to the verified company ID from cryptographically signed HMAC-SHA256 JWTs.'
    },
    {
      q: 'Can human recruiters review the recordings and override AI scores?',
      a: 'Yes. Every interview produces a comprehensive scorecard dossier with full transcript, dimension scores, recorded video playback, and a human evaluator scorecard override panel.'
    },
    {
      q: 'Is the platform compliant with responsible AI hiring practices?',
      a: 'Absolutely. AI evaluations evaluate purely job-relevant technical competencies, problem-solving depth, and communication clarity. Demographics and protected characteristics are strictly excluded from all scoring algorithms.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Dynamic Ambient Aurora Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/15 to-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[400px] bg-gradient-to-bl from-teal-500/10 via-emerald-500/10 to-transparent blur-[120px] rounded-full" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ArdhnarishwarLogo size="md" variant="horizontal" showSubtext={true} />
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Platform Features</a>
            <a href="#workflow" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#ai-engine" className="hover:text-cyan-400 transition-colors">AI Engine</a>
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateAuth('candidate')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
            >
              Candidate Portal
            </button>
            <button
              onClick={() => {
                if (onNavigateSuperAdmin) {
                  onNavigateSuperAdmin();
                } else {
                  onNavigateAuth('admin');
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-600/40 transition-all flex items-center gap-1.5"
              title="Super Administrator Master Portal"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Super Admin HQ</span>
            </button>
            <button
              onClick={() => onNavigateAuth('admin')}
              className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-sm">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Next-Generation Autonomous AI Interview + HRMS SaaS Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.1]">
          Hire 10x Faster with <br />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Autonomous AI Video Interviews
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Screen hundreds of engineering candidates simultaneously with real-time speech AI, adaptive technical follow-ups, objective skill rubrics, and automated candidate scorecards.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigateAuth('company_register')}
            className="px-7 py-3.5 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2 active:scale-95"
          >
            <Building2 className="w-4 h-4" />
            <span>Provision Company Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLaunchCandidateChamber}
            className="px-6 py-3.5 rounded-2xl text-sm font-extrabold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 transition-all flex items-center gap-2 active:scale-95"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Launch AI Interview Chamber</span>
          </button>
        </div>

        {/* Responsible AI Compliance Notice */}
        <div className="pt-2">
          <p className="text-[11px] text-slate-300 max-w-xl mx-auto flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              <strong>Zero Demographic Bias:</strong> AI scoring is strictly competency-based. Evaluations serve as assistive decision-support for human hiring leads.
            </span>
          </p>
        </div>

        {/* Interactive Chamber Preview Card */}
        <div className="pt-8 max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-1.5 bg-gradient-to-b from-slate-700/60 via-slate-800/40 to-slate-900/80 shadow-2xl shadow-cyan-500/10">
            <div className="rounded-[22px] bg-slate-950/90 p-4 sm:p-6 border border-slate-800 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono font-bold text-slate-300 ml-2">Live AI Chamber • Session #882</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold animate-pulse">
                    ● PROCTORING ACTIVE
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">WS 24ms</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      <span>Current AI Question • Robotics Perception</span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-white">
                      "Explain the mathematical formulation of 6-DOF forward kinematics using Denavit-Hartenberg parameters and how you mitigate kinematic singularities."
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-300 uppercase">Live Speech Recognition Transcript</div>
                    <p className="text-xs text-slate-300 font-mono italic">
                      "We assign coordinate frames according to standard DH conventions: link length 'a', link twist 'alpha', link offset 'd', and joint angle 'theta'..."
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-300 mb-2">Real-Time Evaluation Metrics</div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-300">Technical Depth</span>
                          <span className="text-cyan-400 font-bold">92%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className="w-[92%] h-full bg-cyan-500 rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-300">Problem Solving</span>
                          <span className="text-indigo-400 font-bold">88%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className="w-[88%] h-full bg-indigo-500 rounded-full" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-300">Fluency & Clarity</span>
                          <span className="text-emerald-400 font-bold">94%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div className="w-[94%] h-full bg-emerald-500 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-center">
                    <span className="text-[11px] font-bold text-emerald-300">Recommendation: STRONG HIRE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="relative z-10 border-y border-slate-800/80 bg-slate-950/50 py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, idx) => (
            <div key={idx} className="space-y-1">
              <div className="w-8 h-8 mx-auto rounded-lg bg-slate-900 flex items-center justify-center text-cyan-400 mb-2">
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{s.value}</div>
              <div className="text-xs text-slate-300 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Enterprise Capabilities</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Engineered for Modern High-Velocity Hiring
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            A unified full-stack platform that replaces disconnected tools with an integrated autonomous assessment and HRMS pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3 group shadow-lg"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${f.bg} ${f.color}`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                {f.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Step-by-Step Workflow Section */}
      <section id="workflow" className="relative z-10 py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Seamless Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
              From Job Creation to Verified Hire in 4 Steps
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="text-3xl font-black text-cyan-500/40 font-mono">01</div>
              <h4 className="text-sm font-bold text-white">Create Opening & Configure AI</h4>
              <p className="text-xs text-slate-300">
                Define job specifications, required technical skill taxonomies, and let AI generate round questions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="text-3xl font-black text-indigo-500/40 font-mono">02</div>
              <h4 className="text-sm font-bold text-white">Invite or Candidate Self-Apply</h4>
              <p className="text-xs text-slate-300">
                Candidate receives a secure 1-click invitation token or self-registers on the portal with resume.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="text-3xl font-black text-purple-500/40 font-mono">03</div>
              <h4 className="text-sm font-bold text-white">Autonomous AI Video Chamber</h4>
              <p className="text-xs text-slate-300">
                Candidate answers conversational AI prompts with active proctoring, live speech recognition, and video recording.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative">
              <div className="text-3xl font-black text-emerald-500/40 font-mono">04</div>
              <h4 className="text-sm font-bold text-white">Instant Verified AI Scorecard</h4>
              <p className="text-xs text-slate-300">
                HR instantly inspects dimension breakdowns, strengths, weakness radar, video playback, and hire recommendation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Architecture & Open Platform Section */}
      <section id="architecture" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Enterprise Ready</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            100% Open Enterprise Platform
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Unrestricted access to autonomous robotics hiring, AI interview chambers, real-time proctoring, and comprehensive analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="space-y-4">
              <span className="text-xs font-bold font-mono text-cyan-400 uppercase">AUTONOMOUS SCREENING</span>
              <h4 className="text-xl font-extrabold text-white">Unrestricted AI Chambers</h4>
              <p className="text-xs text-slate-300">Run unlimited autonomous interviews with instant biometric sentiment analysis, NLP vector scoring, and proctoring telemetry.</p>
              <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Zero per-interview fees</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Real-time speech WPM & fluency</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Mil-spec proctoring & tab-switch audit</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateAuth('company_register')}
              className="w-full py-3 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-white transition-all"
            >
              Deploy Candidate Chamber
            </button>
          </div>

          <div className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-cyan-500/60 shadow-2xl shadow-cyan-500/10 relative scale-105">
            <div className="space-y-4">
              <span className="text-xs font-bold font-mono text-cyan-400 uppercase">COLLABORATIVE INTERVIEWS</span>
              <h4 className="text-xl font-extrabold text-white">Embedded 1-on-1 Zoom</h4>
              <p className="text-xs text-slate-300">Seamless Web SDK in-app video meetings with automatic cryptographic role-based host and attendee assignment.</p>
              <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>In-app viewport embedding</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Zero redirects or popups</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Synchronized live scorecard review</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateAuth('company_register')}
              className="w-full py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 transition-all"
            >
              Start Free Enterprise Workspace
            </button>
          </div>

          <div className="rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all">
            <div className="space-y-4">
              <span className="text-xs font-bold font-mono text-cyan-400 uppercase">HIGH-PRECISION PIPELINE</span>
              <h4 className="text-xl font-extrabold text-white">Semantic AI Screening</h4>
              <p className="text-xs text-slate-300">Automated multi-format resume parsing and concept alignment against specific job openings with instant ranking.</p>
              <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>PDF, DOC, DOCX document extraction</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Missing competencies radar</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Complete audit log traceability</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigateAuth('candidate')}
              className="w-full py-3 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-white transition-all"
            >
              Candidate Self-Service
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-8 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Questions & Answers</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 text-sm font-bold text-white hover:text-cyan-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* High-Converting CTA Banner */}
      <section className="relative z-10 py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-cyan-950/80 via-indigo-950/80 to-purple-950/80 border border-cyan-500/40 text-center space-y-6 shadow-2xl">
          <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Upgrade Your Hiring Pipeline?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Experience next-generation autonomous AI candidate screening with zero third-party API dependencies and enterprise multi-tenant security.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigateAuth('company_register')}
              className="px-8 py-3.5 rounded-xl font-black text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-400/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-slate-950" />
              <span>Register Your Organization</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLaunchCandidateChamber}
              className="px-6 py-3.5 rounded-xl font-bold text-xs text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Test AI Interview Chamber</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-8 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <ArdhnarishwarLogo size="sm" variant="horizontal" showSubtext={true} />

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>Zero-Trust Auth</span>
            <span>•</span>
            <span>WebSocket Live Bus</span>
            <span>•</span>
            <span>In-House AI Engine</span>
            <span>•</span>
            <button
              onClick={() => {
                if (onNavigateSuperAdmin) {
                  onNavigateSuperAdmin();
                } else {
                  onNavigateAuth('admin');
                }
              }}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Super Admin HQ</span>
            </button>
          </div>

          <div className="text-slate-300 font-mono text-[11px]">
            Ardhnarishwar AI SaaS © 2026 • All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};
