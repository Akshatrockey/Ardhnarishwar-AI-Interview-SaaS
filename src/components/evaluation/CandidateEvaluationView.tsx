import React, { useState, useRef, useEffect } from 'react';
import { Candidate, InterviewSession, JobPosition, Company } from '../../types';
import { AppDataStore, getVideoBlob } from '../../services/storage';
import { useTenant } from '../../context/TenantContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Award, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileDown, 
  Printer, 
  User, 
  Clock, 
  Briefcase, 
  Bot, 
  ChevronRight, 
  Tag, 
  Sparkles,
  Volume2,
  Calendar,
  Layers,
  TrendingUp,
  BarChart2,
  Video
} from 'lucide-react';

interface CandidateEvaluationViewProps {
  candidateId?: string;
  onBack?: () => void;
  onLaunchConference?: (candidate: Candidate) => void;
}

export const CandidateEvaluationView: React.FC<CandidateEvaluationViewProps> = ({
  candidateId,
  onBack,
  onLaunchConference,
}) => {
  const { currentCompany } = useTenant();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidateId || '');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [job, setJob] = useState<JobPosition | null>(null);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [showStatusToast, setShowStatusToast] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load data
  useEffect(() => {
    const allCand = AppDataStore.getCandidates().filter(c => 
      !currentCompany || c.companyId === currentCompany.id || currentCompany.id === 'comp_ardhnarishwar'
    );
    setCandidates(allCand);

    const activeId = candidateId || (allCand.find(c => c.status === 'EVALUATED' || c.status === 'SHORTLISTED')?.id || allCand[0]?.id || '');
    setSelectedCandidateId(activeId);
  }, [candidateId, currentCompany]);

  useEffect(() => {
    if (!selectedCandidateId) return;

    const cand = AppDataStore.getCandidates().find(c => c.id === selectedCandidateId);
    if (!cand) return;

    const allSessions = AppDataStore.getSessions();
    const activeSession = allSessions.find(s => s.candidateId === cand.id) || allSessions[0] || null;
    setSession(activeSession);

    if (cand.jobId) {
      const j = AppDataStore.getJobs().find(job => job.id === cand.jobId) || null;
      setJob(j);
    }

    // Try loading video from IndexedDB
    if (activeSession) {
      getVideoBlob(activeSession.id).then(blob => {
        if (blob) {
          setVideoBlobUrl(URL.createObjectURL(blob));
        } else {
          setVideoBlobUrl(null);
        }
      });
    }
  }, [selectedCandidateId]);

  const activeCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];
  const report = session?.aiReport;
  const currentAnswer = session?.answers[selectedQuestionIdx] || session?.answers[0];

  // Jump Video to Question Timestamp
  const jumpToQuestion = (idx: number) => {
    setSelectedQuestionIdx(idx);
    if (session && session.answers[idx]) {
      const startSec = session.answers[idx].videoTimestampStart || 0;
      setCurrentTimeSec(startSec);
      if (videoRef.current) {
        videoRef.current.currentTime = startSec;
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTimeSec(Math.round(videoRef.current.currentTime));
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update Candidate Status (Shortlist / Reject)
  const updateCandidateStatus = (newStatus: 'SHORTLISTED' | 'REJECTED' | 'HIRED') => {
    if (!activeCandidate) return;
    const all = AppDataStore.getCandidates();
    const updated = all.map(c => c.id === activeCandidate.id ? { ...c, status: newStatus } : c);
    AppDataStore.saveCandidates(updated);
    setCandidates(updated);

    AppDataStore.logActivity({
      companyId: activeCandidate.companyId,
      actorId: 'usr_recruiter',
      actorName: 'Recruiter Lead',
      actorRole: 'RECRUITER',
      action: `CANDIDATE_${newStatus}`,
      resource: `Candidate: ${activeCandidate.firstName} ${activeCandidate.lastName}`,
      details: `Recruiter marked candidate as ${newStatus} based on AI score ${session?.overallScore}/100`,
      ipAddress: '127.0.0.1',
      severity: newStatus === 'REJECTED' ? 'WARNING' : 'INFO',
    });

    setShowStatusToast(`Candidate marked as ${newStatus}!`);
    setTimeout(() => setShowStatusToast(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!activeCandidate) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Bot className="w-12 h-12 mx-auto mb-3 text-cyan-500 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-200">No Candidate Evaluations Found</h3>
        <p className="text-xs text-slate-400 mt-1">Conduct a candidate interview or select an evaluated candidate from the pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {showStatusToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{showStatusToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-cyan-600/30">
            {activeCandidate.firstName[0]}{activeCandidate.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white">
                {activeCandidate.firstName} {activeCandidate.lastName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                activeCandidate.status === 'SHORTLISTED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                activeCandidate.status === 'REJECTED' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                'bg-cyan-950 text-cyan-300 border-cyan-800'
              }`}>
                {activeCandidate.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{job?.title || 'Lead Robotics Perception Engineer'}</span>
              <span>•</span>
              <span>{activeCandidate.yearsOfExperience} Years Exp</span>
              <span>•</span>
              <span>{activeCandidate.email}</span>
            </p>
          </div>
        </div>

        {/* Candidate Selector & Action Buttons */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedCandidateId}
            onChange={(e) => setSelectedCandidateId(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 outline-none focus:border-cyan-500"
          >
            {candidates.map(c => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.status})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Export official printable dossier"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print / PDF</span>
          </button>

          {onLaunchConference && activeCandidate && (
            <button
              onClick={() => onLaunchConference(activeCandidate)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all active:scale-95"
              title="Connect candidate with HR, Company Admin & Super Admin in Live Zoom Meeting"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Live Zoom Panel</span>
            </button>
          )}

          <button
            onClick={() => updateCandidateStatus('SHORTLISTED')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Shortlist</span>
          </button>

          <button
            onClick={() => updateCandidateStatus('REJECTED')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>
        </div>
      </div>

      {/* Main Scorecard Overview Grid */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall AI Score */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-800/40 shadow-xl space-y-2">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Overall AI Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{report.overallScore}</span>
              <span className="text-sm font-mono text-cyan-400">/ 100</span>
            </div>
            <div className="text-xs font-bold text-slate-300">
              Recommendation: <span className="text-cyan-300 font-extrabold">{report.recommendation.replace(/_/g, ' ')}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full" style={{ width: `${report.overallScore}%` }}></div>
            </div>
          </div>

          {/* Technical Rigor */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Technical Depth</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{report.dimensionScores.technicalDepth}</span>
              <span className="text-sm font-mono text-indigo-400">/ 100</span>
            </div>
            <div className="text-xs text-slate-400">Concept coverage & mathematical rigor</div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full" style={{ width: `${report.dimensionScores.technicalDepth}%` }}></div>
            </div>
          </div>

          {/* Communication & Fluency */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Communication & Clarity</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{report.dimensionScores.communication}</span>
              <span className="text-sm font-mono text-purple-400">/ 100</span>
            </div>
            <div className="text-xs text-slate-400">Speech pacing & structural coherence</div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full" style={{ width: `${report.dimensionScores.communication}%` }}></div>
            </div>
          </div>

          {/* Problem Solving / STAR */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Problem Solving</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{report.dimensionScores.problemSolving}</span>
              <span className="text-sm font-mono text-emerald-400">/ 100</span>
            </div>
            <div className="text-xs text-slate-400">Trade-offs, edge-cases & STAR impact</div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full" style={{ width: `${report.dimensionScores.problemSolving}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Dual Column Workspace: Video Player + Question Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Replay & Question Timestamp Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Synchronized Video Replay
              </h2>
              <span className="text-[10px] font-mono text-cyan-400">
                {Math.floor(currentTimeSec / 60)}:{(currentTimeSec % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Video Canvas / Video Player */}
            <div className="w-full aspect-video bg-black/80 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
              {videoBlobUrl ? (
                <video
                  ref={videoRef}
                  src={videoBlobUrl}
                  onTimeUpdate={handleTimeUpdate}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                    <Play className="w-6 h-6 ml-0.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">Archived High-Definition Video Stream</span>
                  <span className="text-[10px] text-slate-500">Audio/video stream indexed to question timestamps</span>
                </div>
              )}
            </div>

            {/* Clickable Question Timeline Bookmarks */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Click Question to Seek Video
              </div>

              {session?.answers.map((ans, idx) => {
                const isSelected = selectedQuestionIdx === idx;
                return (
                  <button
                    key={ans.questionId}
                    onClick={() => jumpToQuestion(idx)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 font-semibold shadow-sm'
                        : 'bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Q{idx + 1}
                      </span>
                      <span className="truncate">{ans.questionTitle}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {Math.floor(ans.videoTimestampStart / 60)}:{(ans.videoTimestampStart % 60).toString().padStart(2, '0')}
                      </span>
                      <span className={`text-[11px] font-bold font-mono ${
                        ans.score >= 85 ? 'text-emerald-400' : ans.score >= 70 ? 'text-cyan-400' : 'text-amber-400'
                      }`}>
                        {ans.score}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Executive Recruiter Summary Card */}
          {report && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AI Executive Recruiter Summary
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {report.executiveSummary}
              </p>

              {/* Strengths & Weaknesses */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Key Strengths</div>
                <ul className="space-y-1 text-xs text-slate-300">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>

                {report.weaknesses.length > 0 && (
                  <>
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider pt-2">Areas for Follow-up</div>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {report.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question-by-Question Deep Dive */}
        <div className="lg:col-span-7 space-y-4">
          {currentAnswer && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                      Question {selectedQuestionIdx + 1} of {session?.answers.length}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${
                      (currentAnswer.status || (currentAnswer.score >= 80 ? 'CORRECT' : currentAnswer.score >= 45 ? 'PARTIALLY_CORRECT' : 'INCORRECT')) === 'CORRECT'
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                        : (currentAnswer.status || (currentAnswer.score >= 80 ? 'CORRECT' : currentAnswer.score >= 45 ? 'PARTIALLY_CORRECT' : 'INCORRECT')) === 'PARTIALLY_CORRECT'
                        ? 'bg-amber-950/90 text-amber-300 border-amber-700'
                        : 'bg-rose-950/90 text-rose-300 border-rose-700'
                    }`}>
                      {(currentAnswer.status || (currentAnswer.score >= 80 ? 'CORRECT' : currentAnswer.score >= 45 ? 'PARTIALLY_CORRECT' : 'INCORRECT')).replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1.5">{currentAnswer.questionTitle}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Question Score</div>
                    <div className="text-xl font-extrabold text-cyan-400 font-mono">
                      {currentAnswer.obtainedScore ?? Math.round(((currentAnswer.score / 100) * (currentAnswer.maxScore || 10)) * 10) / 10} / {currentAnswer.maxScore || 10} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate Response Transcript */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Candidate Verbatim Transcript:</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Pacing: {currentAnswer.wpm} WPM • Fillers: {currentAnswer.fillerWordCount}
                  </span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans italic">
                  "{currentAnswer.transcript}"
                </div>
              </div>

              {/* Predefined Expected Answer */}
              {currentAnswer.expectedAnswer && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Predefined Expected Answer (Admin Ground Truth):</span>
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-emerald-950/80">
                    {currentAnswer.expectedAnswer}
                  </div>
                </div>
              )}

              {/* AI Evaluation Reason */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-900/50 space-y-1.5">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  AI Evaluation Reason & Scoring Rationale
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {currentAnswer.evaluationReason || currentAnswer.feedback}
                </p>
              </div>

              {/* Concept Coverage Graph Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">Technical Key Concept Coverage</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentAnswer.keyConceptsIdentified.map((c, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {c}
                    </span>
                  ))}
                  {currentAnswer.missingConcepts.map((c, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 line-through">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Question Dimension Gauges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Relevance</div>
                  <div className="text-base font-bold text-cyan-400">{currentAnswer.dimensionScores.relevance}%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Technical Depth</div>
                  <div className="text-base font-bold text-indigo-400">{currentAnswer.dimensionScores.technicalDepth}%</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Problem Solving</div>
                  <div className="text-base font-bold text-emerald-400">{currentAnswer.dimensionScores.problemSolving}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
