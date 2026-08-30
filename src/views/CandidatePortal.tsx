import React, { useState, useEffect } from 'react';
import { Candidate, JobPosition, InterviewRound, Question, InterviewSession } from '../types';
import { AppDataStore } from '../services/storage';
import { HardwareDiagnostic } from '../components/candidate/HardwareDiagnostic';
import { LiveAIInterviewChamber } from '../components/candidate/LiveAIInterviewChamber';
import { CandidateScorecardView } from '../components/evaluation/CandidateScorecardView';
import { LiveVideoConferenceRoom } from '../components/conference/LiveVideoConferenceRoom';
import { ArdhnarishwarLogo } from '../components/common/ArdhnarishwarLogo';
import { useTheme } from '../context/ThemeContext';
import { useRealtime } from '../context/RealtimeContext';
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Laptop,
  Briefcase,
  Layers,
  ChevronLeft,
  Award,
  Search,
  Eye,
  Video,
  Sun,
  Moon,
  Wifi
} from 'lucide-react';

interface CandidatePortalProps {
  onBackToApp?: () => void;
  initialToken?: string;
  onViewEvaluation?: (sessionId: string) => void;
}

export const CandidatePortal: React.FC<CandidatePortalProps> = ({
  onBackToApp,
  initialToken = '',
  onViewEvaluation,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isConnected, latencyMs } = useRealtime();

  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [job, setJob] = useState<JobPosition | null>(null);
  const [round, setRound] = useState<InterviewRound | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [step, setStep] = useState<'TOKEN_ENTRY' | 'DIAGNOSTICS' | 'INTERVIEW' | 'COMPLETED' | 'SCORECARD_VIEW' | 'LIVE_CONFERENCE'>('TOKEN_ENTRY');
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const verifyAndLaunchToken = (tokenToVerify: string) => {
    setErrorMessage('');
    const allCand = AppDataStore.getCandidates();
    const found = allCand.find(c => c.interviewToken.toUpperCase() === tokenToVerify.trim().toUpperCase());

    if (!found) {
      setErrorMessage('Invalid or expired interview token. Please check your invitation email or register on the portal.');
      return false;
    }

    setCandidate(found);

    // If candidate has already completed interview, jump directly to Scorecard & Result!
    if (found.status === 'EVALUATED' || found.status === 'HIRED' || found.interviewSessionId) {
      setCompletedSessionId(found.interviewSessionId || '');
      setStep('SCORECARD_VIEW');
      return true;
    }

    // Fetch Job & Round
    const allJobs = AppDataStore.getJobs();
    const foundJob = allJobs.find(j => j.id === found.jobId) || allJobs[0];
    setJob(foundJob);

    const allRounds = AppDataStore.getRounds();
    const foundRound = allRounds.find(r => r.jobId === foundJob.id) || allRounds[0];
    setRound(foundRound);

    // Fetch Questions
    const allQuestions = AppDataStore.getQuestions();
    const roundQuestions = allQuestions.filter(q => foundRound.questionIds.includes(q.id));
    setQuestions(roundQuestions.length > 0 ? roundQuestions : allQuestions.slice(0, 4));

    setStep('DIAGNOSTICS');
    return true;
  };

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      verifyAndLaunchToken(initialToken);
    }
  }, [initialToken]);

  const handleVerifyToken = () => {
    verifyAndLaunchToken(tokenInput);
  };

  const handleDiagnosticsPassed = (diag: any) => {
    setDiagnosticsData(diag);
    setStep('INTERVIEW');
  };

  const handleInterviewFinished = (sessionId: string) => {
    setCompletedSessionId(sessionId);
    setStep('SCORECARD_VIEW');
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col justify-between font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <ArdhnarishwarLogo size="sm" variant="horizontal" showSubtext={true} />

        <div className="flex items-center gap-3">
          {/* WebSocket Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 font-bold">
            <Wifi className="w-3.5 h-3.5" />
            <span>WS LIVE ({latencyMs}ms)</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'enterprise-light' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {step === 'SCORECARD_VIEW' && (
            <button
              onClick={() => setStep('TOKEN_ENTRY')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              New Token
            </button>
          )}

          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Return to Console</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6">
        
        {/* Step 1: Token Entry / Scorecard Lookup */}
        {step === 'TOKEN_ENTRY' && (
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 my-8">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Enter Candidate Interview Chamber</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your unique invitation token to start your AI robotics video interview or instantly inspect your verified scorecard dossier.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Interview Access Token</label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter your invitation token (e.g. TOKEN_XXXX)"
                  className="w-full mt-1.5 p-3.5 rounded-xl font-mono text-sm bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-cyan-300 font-bold outline-none uppercase tracking-wider"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleVerifyToken}
                className="w-full py-3.5 rounded-xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Verify Token & Access Chamber</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Demo Tokens */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                ⚡ Quick Demo Candidates
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setTokenInput('TOKEN_PRIYA_ROBOTICS_2026'); }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                >
                  <div className="text-xs font-bold text-cyan-300">Priya Sharma</div>
                  <div className="text-[10px] text-slate-400 truncate">Lead Perception (88%)</div>
                </button>
                <button
                  onClick={() => { setTokenInput('TOKEN_MARCUS_EMBEDDED_2026'); }}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors"
                >
                  <div className="text-xs font-bold text-indigo-300">Marcus Vance</div>
                  <div className="text-[10px] text-slate-400 truncate">Embedded Real-Time C++</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Diagnostics */}
        {step === 'DIAGNOSTICS' && candidate && (
          <HardwareDiagnostic
            candidateName={`${candidate.firstName} ${candidate.lastName}`}
            jobTitle={job?.title || 'Robotics Engineer'}
            roundName={round?.name || 'Round 1: AI Technical Assessment'}
            onPassed={handleDiagnosticsPassed}
          />
        )}

        {/* Step 3: Live AI Interview Chamber */}
        {step === 'INTERVIEW' && candidate && job && round && (
          <LiveAIInterviewChamber
            candidate={candidate}
            job={job}
            round={round}
            questions={questions}
            diagnostics={diagnosticsData}
            onFinish={handleInterviewFinished}
          />
        )}

        {/* Step 4: Candidate Scorecard View */}
        {step === 'SCORECARD_VIEW' && (
          <div className="w-full max-w-6xl py-4 space-y-6">
            <CandidateScorecardView
              candidateId={candidate?.id || 'cand_priya_01'}
              sessionId={completedSessionId}
              onBack={() => setStep('TOKEN_ENTRY')}
            />
          </div>
        )}

        {/* Step 5: Live Video Conference Room */}
        {step === 'LIVE_CONFERENCE' && candidate && (
          <div className="w-full max-w-7xl">
            <LiveVideoConferenceRoom
              initialRoomId={`ROOM-PANEL-${candidate.firstName.toUpperCase()}-${candidate.lastName.toUpperCase()}-2026`}
              candidateName={`${candidate.firstName} ${candidate.lastName}`}
              jobTitle={job?.title || 'Robotics Engineer'}
              onLeaveRoom={() => setStep('SCORECARD_VIEW')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3 text-center text-xs text-slate-500 font-mono">
        Ardhnarishwar Autonomous AI Assessment System • 100% In-House NLP Engine • Zero External APIs
      </footer>
    </div>
  );
};
