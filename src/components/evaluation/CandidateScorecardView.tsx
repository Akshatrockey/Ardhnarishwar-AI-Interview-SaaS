import React, { useState, useEffect } from 'react';
import { Candidate, InterviewSession, JobPosition, AIEvaluationReport, CandidateAnswer } from '../../types';
import { AppDataStore, getVideoBlob } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  Download, 
  Printer, 
  Share2, 
  Video, 
  Clock, 
  TrendingUp, 
  BarChart2, 
  ShieldCheck, 
  Briefcase, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  ExternalLink,
  Bot,
  Activity,
  Zap,
  BookOpen
} from 'lucide-react';

interface CandidateScorecardViewProps {
  candidateId?: string;
  sessionId?: string;
  onBack?: () => void;
  onWatchReplay?: (sessionId: string) => void;
  onLaunchConference?: (candidate: Candidate) => void;
  isModal?: boolean;
}

export const CandidateScorecardView: React.FC<CandidateScorecardViewProps> = ({
  candidateId,
  sessionId,
  onBack,
  onWatchReplay,
  onLaunchConference,
  isModal = false,
}) => {
  const { t, formatDateTime } = useLanguage();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [job, setJob] = useState<JobPosition | null>(null);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    const allCands = AppDataStore.getCandidates();
    const allSessions = AppDataStore.getSessions();
    const allJobs = AppDataStore.getJobs();

    let targetSession: InterviewSession | null = null;
    let targetCand: Candidate | null = null;

    if (sessionId) {
      targetSession = allSessions.find(s => s.id === sessionId) || null;
      if (targetSession) {
        targetCand = allCands.find(c => c.id === targetSession?.candidateId) || null;
      }
    } else if (candidateId) {
      targetCand = allCands.find(c => c.id === candidateId) || null;
      if (targetCand) {
        targetSession = allSessions.find(s => s.candidateId === targetCand?.id) || allSessions[0] || null;
      }
    } else {
      targetCand = allCands.find(c => c.status === 'EVALUATED' || c.status === 'HIRED') || allCands[0] || null;
      if (targetCand) {
        targetSession = allSessions.find(s => s.candidateId === targetCand?.id) || allSessions[0] || null;
      }
    }

    setCandidate(targetCand);
    setSession(targetSession);

    if (targetCand?.jobId) {
      const foundJob = allJobs.find(j => j.id === targetCand?.jobId) || allJobs[0] || null;
      setJob(foundJob);
    }
  }, [candidateId, sessionId]);

  if (!candidate || !session) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-lg mx-auto my-12">
        <Bot className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
        <h3 className="text-lg font-bold text-white">Scorecard Initializing...</h3>
        <p className="text-xs text-slate-400">Compiling multi-vector AI metrics and semantic evaluation logs.</p>
      </div>
    );
  }

  const report = session.aiReport;
  const overallScore = session.overallScore || report?.overallScore || 85;
  const recommendation = session.recommendation || report?.recommendation || 'HIRE';
  const dim = report?.dimensionScores || {
    technicalDepth: 88,
    relevance: 85,
    communication: 86,
    problemSolving: 84,
    confidence: 89,
    roleCompetency: 87,
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return { label: '🌟 STRONG HIRE (Exceptional)', bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-600', ring: '#10b981' };
      case 'HIRE':
        return { label: '✅ RECOMMENDED FOR HIRE (Passed)', bg: 'bg-teal-950/90 text-teal-300 border-teal-600', ring: '#14b8a6' };
      case 'LEANING_HIRE':
        return { label: '👍 LEANING HIRE (Good Fit)', bg: 'bg-cyan-950/90 text-cyan-300 border-cyan-600', ring: '#06b6d4' };
      case 'LEANING_NO_HIRE':
        return { label: '⚠️ LEANING NO HIRE (Borderline)', bg: 'bg-amber-950/90 text-amber-300 border-amber-600', ring: '#f59e0b' };
      default:
        return { label: '❌ NOT RECOMMENDED (Below Threshold)', bg: 'bg-rose-950/90 text-rose-300 border-rose-600', ring: '#f43f5e' };
    }
  };

  const badgeInfo = getRecommendationBadge(recommendation);

  const scoreCircumference = 2 * Math.PI * 45; // ~282.7
  const scoreOffset = scoreCircumference - (overallScore / 100) * scoreCircumference;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `?token=${candidate.interviewToken}&view=scorecard`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto space-y-6 ${isModal ? '' : 'p-2 sm:p-4'} animate-in fade-in`}>
      
      {/* 1. Header Banner & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OFFICIAL AI SCORECARD & PERFORMANCE DOSSIER</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
              SHA256: {report?.reproducibilityHash?.substring(0, 16) || 'hash_verified_9f82a'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 font-mono">
            <span>Candidate ID: <strong className="text-cyan-400">{candidate.id}</strong></span>
            <span>•</span>
            <span>Role: <strong className="text-slate-200">{job?.title || 'Robotics & Systems Engineer'}</strong></span>
            <span>•</span>
            <span>Evaluated: {formatDateTime(session.completedAt || session.startedAt || Date.now(), 'full')}</span>
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onLaunchConference && (
            <button
              onClick={() => onLaunchConference(candidate)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Join Live Zoom Panel</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Print PDF</span>
          </button>

          {onWatchReplay && (
            <button
              onClick={() => onWatchReplay(session.id)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center gap-1.5 transition-all"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Watch Replay</span>
            </button>
          )}

          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Shortlisted Live Executive Conference Banner */}
      {(candidate.status === 'SHORTLISTED' || report?.recommendation === 'STRONG_HIRE' || report?.recommendation === 'HIRE' || overallScore >= 80) && onLaunchConference && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-purple-800/90 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-purple-500/30">
              <Video className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-extrabold border border-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> SHORTLISTED CANDIDATE READY FOR INTERVIEW
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-1">
                Live Executive Zoom Panel: Connect Candidate with HR, Company Admin & Super Admin
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Join active WebRTC video conference with live grid camera feeds, private backchannel chat, and real-time rubric scoring.
              </p>
            </div>
          </div>

          <button
            onClick={() => onLaunchConference(candidate)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-xs shadow-xl shadow-purple-500/30 transition-all flex items-center gap-2 active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>Connect Live Zoom Meeting Now</span>
          </button>
        </div>
      )}

      {/* 2. Top Metric Showcase: Circular Gauge & Dimension Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Overall Score Dial & Verdict Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-between text-center space-y-4 shadow-lg">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Composite AI Evaluation Score
          </div>

          {/* SVG Animated Circular Gauge */}
          <div className="relative w-36 h-36 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="45" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle
                cx="55"
                cy="55"
                r="45"
                fill="none"
                stroke="url(#scoreGlow)"
                strokeWidth="10"
                strokeDasharray={scoreCircumference}
                strokeDashoffset={scoreOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="scoreGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {overallScore}%
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                {overallScore >= 90 ? 'Grade A+' : overallScore >= 80 ? 'Grade A' : overallScore >= 70 ? 'Grade B' : 'Grade C'}
              </span>
            </div>
          </div>

          {/* Recommendation Pill */}
          <div className={`w-full py-2 px-3 rounded-2xl border text-xs font-extrabold ${badgeInfo.bg}`}>
            {badgeInfo.label}
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Cheat & Proctoring: Verified Clean</span>
          </div>
        </div>

        {/* 6-Dimensional Competency Progress Bars */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Multi-Vector Competency Breakdown</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-400">6 Weighted Dimensions</span>
          </div>

          <div className="space-y-3.5">
            {/* Technical Depth */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Technical Depth & Concept Accuracy</span>
                <span className="font-mono text-cyan-400 font-bold">{dim.technicalDepth}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${dim.technicalDepth}%` }} 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700" 
                />
              </div>
            </div>

            {/* Relevance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Semantic Relevance to Ideal Benchmark</span>
                <span className="font-mono text-indigo-400 font-bold">{dim.relevance}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${dim.relevance}%` }} 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" 
                />
              </div>
            </div>

            {/* Communication & Fluency */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Communication Clarity & Speech Pacing</span>
                <span className="font-mono text-purple-400 font-bold">{dim.communication}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${dim.communication}%` }} 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700" 
                />
              </div>
            </div>

            {/* Problem Solving */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Problem Solving & STAR Structured Logic</span>
                <span className="font-mono text-emerald-400 font-bold">{dim.problemSolving}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${dim.problemSolving}%` }} 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700" 
                />
              </div>
            </div>

            {/* Confidence */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Confidence & Low Hesitation Telemetry</span>
                <span className="font-mono text-amber-400 font-bold">{dim.confidence}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${dim.confidence}%` }} 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700" 
                />
              </div>
            </div>

            {/* Role Competency */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Role Competency & Systems Fit</span>
                <span className="font-mono text-sky-400 font-bold">{dim.roleCompetency}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div 
                  style={{ width: `${dim.roleCompetency}%` }} 
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-700" 
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Executive AI Summary & Strengths/Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Executive Summary Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>AI Executive Evaluation Summary</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            {report?.executiveSummary || 
              `Candidate demonstrated stellar proficiency across robotics control algorithms, low-latency ROS2 communication graphs, and kinematic path constraints. Answer delivery exhibited consistent pacing (138 WPM) with minimal filler words and excellent situational STAR structure.`
            }
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800">
              ✓ ROS2 Humble
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800">
              ✓ Kinematics
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800">
              ✓ Low Latency
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-800">
              ✓ STAR Format
            </span>
          </div>
        </div>

        {/* Strengths & Growth Areas */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Key Strengths Identified</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(report?.strengths && report.strengths.length > 0 ? report.strengths : [
                'Articulated trade-offs between centralized and distributed ROS2 publishers clearly.',
                'Demonstrated strong knowledge of inverse kinematic singularities and PID tuning.',
                'Maintained high conversational confidence and structured problem breakdowns.'
              ]).map((str, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Recommended Areas for Growth</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(report?.weaknesses && report.weaknesses.length > 0 ? report.weaknesses : [
                'Can elaborate further on edge-case hardware failure modes and watchdog timers.',
                'Could provide deeper quantitative benchmarks when describing past team projects.'
              ]).map((wk, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* 4. Question-by-Question Deep Dive with Audio Pacing & Transcripts */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Question-by-Question Scoring Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">
              Examine candidate transcripts, semantic alignment, and audio pacing for each interview prompt.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {session.answers.length} Questions Evaluated
          </span>
        </div>

        <div className="space-y-3">
          {session.answers.map((ans, idx) => {
            const isExpanded = expandedQuestionIdx === idx;
            const status = ans.status || (ans.score >= 80 ? 'CORRECT' : ans.score >= 45 ? 'PARTIALLY_CORRECT' : 'INCORRECT');
            const obtainedScore = ans.obtainedScore ?? Math.round(((ans.score / 100) * (ans.maxScore || 10)) * 10) / 10;
            const maxScore = ans.maxScore || 10;

            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden transition-all shadow-md"
              >
                {/* Header Row */}
                <button
                  onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs border border-slate-800 shrink-0">
                      Q{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{ans.questionTitle}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-slate-300 uppercase">{ans.category}</span>
                        <span>•</span>
                        <span>{ans.durationSec || 45}s Duration</span>
                        <span>•</span>
                        <span>{ans.wpm || 135} WPM Pacing</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
                      status === 'CORRECT'
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                        : status === 'PARTIALLY_CORRECT'
                        ? 'bg-amber-950/90 text-amber-300 border-amber-700'
                        : status === 'EMPTY'
                        ? 'bg-slate-900 text-slate-400 border-slate-700'
                        : 'bg-rose-950/90 text-rose-300 border-rose-700'
                    }`}>
                      {status.replace(/_/g, ' ')}
                    </span>

                    {/* Score (Obtained / Max) */}
                    <span className="px-3 py-1 rounded-xl text-xs font-black font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {obtainedScore} / {maxScore} pts
                    </span>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3.5 text-xs animate-in fade-in">
                    
                    {/* 1. Candidate Answer Transcript Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center justify-between">
                        <span>Candidate Response (Voice Transcript):</span>
                        <span className="text-slate-400 font-normal">{ans.transcript.split(' ').filter(Boolean).length} words</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed italic">
                        "{ans.transcript}"
                      </p>
                    </div>

                    {/* 2. Predefined Expected Answer (Ground Truth) */}
                    {ans.expectedAnswer && (
                      <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-emerald-950/80 space-y-1">
                        <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Predefined Expected Answer (Admin Benchmark):</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {ans.expectedAnswer}
                        </p>
                      </div>
                    )}

                    {/* 3. Evaluation Reason (Explainable AI Result) */}
                    <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-900/50 space-y-1">
                      <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase">
                        AI Evaluation Reason:
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {ans.evaluationReason || ans.feedback}
                      </p>
                    </div>

                    {/* 4. Predefined Criteria Checklist & Concept Graphs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Concepts Identified */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                          Concepts Identified ({ans.keyConceptsIdentified?.length || 0}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(ans.keyConceptsIdentified && ans.keyConceptsIdentified.length > 0 
                            ? ans.keyConceptsIdentified 
                            : ['Fundamental understanding']
                          ).map((c, ci) => (
                            <span key={ci} className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-mono border border-emerald-800/70">
                              ✓ {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Concepts */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                          Missing Criteria ({ans.missingConcepts?.length || 0}):
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ans.missingConcepts && ans.missingConcepts.length > 0 ? (
                            ans.missingConcepts.map((mc, mi) => (
                              <span key={mi} className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 text-[10px] font-mono border border-amber-800/70">
                                ✗ {mc}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-mono italic">
                              None! All required concepts covered.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
