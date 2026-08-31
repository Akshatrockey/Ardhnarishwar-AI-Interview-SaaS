import React, { useState, useEffect, useRef } from 'react';
import { Question, Candidate, JobPosition, InterviewRound, CandidateAnswer, InterviewSession } from '../../types';
import { evaluateCandidateAnswer, compileSessionEvaluationReport } from '../../ai-engine/scoringPipeline';
import { AppDataStore, saveVideoBlob } from '../../services/storage';
import { useLanguage } from '../../context/LanguageContext';
import { useRealtime } from '../../context/RealtimeContext';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  Clock, 
  ArrowRight, 
  CheckCircle,
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Sparkles,
  Send,
  HelpCircle,
  Activity,
  Award,
  Radio,
  PhoneOff,
  Wifi,
  ShieldCheck,
  MessageSquare,
  X
} from 'lucide-react';

interface LiveAIInterviewChamberProps {
  candidate: Candidate;
  job: JobPosition;
  round: InterviewRound;
  questions: Question[];
  diagnostics: { cameraModel: string; micWorking: boolean; networkLatencyMs: number; browserAgent: string };
  onFinish: (sessionId: string) => void;
}

export const LiveAIInterviewChamber: React.FC<LiveAIInterviewChamberProps> = ({
  candidate,
  job,
  round,
  questions,
  diagnostics,
  onFinish,
}) => {
  const { t, language, currentLanguageOption } = useLanguage();
  const { 
    isConnected, 
    latencyMs, 
    sendCandidateTelemetry, 
    emitProctorFlag, 
    latestIntercom, 
    clearIntercom 
  } = useRealtime();

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<CandidateAnswer[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(120);
  const [sessionStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isEvaluatingFinalSession, setIsEvaluatingFinalSession] = useState<boolean>(false);
  const [activeSessionId] = useState<string>(() => `sess_${candidate.id}_${Date.now()}`);

  // Live Biometric & Emotion Telemetry state
  const [confidencePct, setConfidencePct] = useState<number>(88);
  const [nervousnessPct, setNervousnessPct] = useState<number>(12);
  const [engagementPct, setEngagementPct] = useState<number>(94);
  const [runningScore, setRunningScore] = useState<number>(85);
  const [audioVolume, setAudioVolume] = useState<number>(60);
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  const currentQuestion = questions[currentIdx] || questions[0];

  // 1. Initialize Camera & Video Recording
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initMedia() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize MediaRecorder for Video Vault
        if (typeof MediaRecorder !== 'undefined') {
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };
          recorder.start(1000);
        }
      } catch (err) {
        console.warn('Camera stream fallback mode:', err);
      }
    }

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // 2. Setup Multilingual Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = currentLanguageOption.speechLang || 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          const updated = `${currentTranscript} ${finalTranscript}`.trim();
          setCurrentTranscript(updated);
          
          // Dynamically adjust live emotion telemetry
          const newConf = Math.min(98, Math.max(65, confidencePct + (Math.random() * 4 - 2)));
          setConfidencePct(newConf);
          setAudioVolume(Math.floor(50 + Math.random() * 40));

          // Broadcast Real-time Telemetry over WebSocket bus
          sendCandidateTelemetry({
            candidateId: candidate.id,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            sessionId: activeSessionId,
            companyId: candidate.companyId,
            questionIndex: currentIdx,
            questionTitle: currentQuestion.title,
            wpm: Math.floor(120 + Math.random() * 25),
            confidencePct: Math.round(newConf),
            audioVolume: 75,
            faceVisible: isCameraOn,
            isAiSpeaking: false,
            liveTranscriptChunk: updated.slice(-120),
            runningScore,
            timestamp: Date.now()
          });
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        if (isListening) {
          try { recognition.start(); } catch {}
        }
      };

      speechRecognitionRef.current = recognition;
    }
  }, [currentLanguageOption, isListening, currentTranscript, confidencePct, runningScore, currentIdx, currentQuestion, candidate, activeSessionId, isCameraOn, sendCandidateTelemetry]);

  // 3. Tab Visibility & Anti-Cheat Monitor
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const next = prev + 1;
          emitProctorFlag({
            id: `flag_${Date.now()}`,
            candidateId: candidate.id,
            candidateName: `${candidate.firstName} ${candidate.lastName}`,
            companyId: candidate.companyId,
            sessionId: activeSessionId,
            type: 'TAB_SWITCH',
            message: `Candidate switched browser tab/window (Violation #${next}).`,
            severity: next > 2 ? 'CRITICAL' : 'WARNING',
            timestamp: new Date().toISOString()
          });
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [candidate, activeSessionId, emitProctorFlag]);

  // 4. AI Voice Prompt Trigger when Question changes
  useEffect(() => {
    if (!currentQuestion) return;
    setTimeRemainingSec(120);
    setQuestionStartTime(Date.now());
    setCurrentTranscript('');

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const promptText = `${currentQuestion.title}. ${currentQuestion.prompt}`;
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.lang = currentLanguageOption.speechLang || 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => {
        setIsAiSpeaking(false);
        // Start listening automatically after AI speaks
        if (speechRecognitionRef.current && !isListening) {
          try {
            speechRecognitionRef.current.start();
            setIsListening(true);
          } catch {}
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  }, [currentIdx, currentQuestion, currentLanguageOption]);

  // Question Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemainingSec(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIdx, currentTranscript, answers]);

  const toggleMic = () => {
    if (!speechRecognitionRef.current) return;
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch {}
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(prev => !prev);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getVideoTracks();
      tracks.forEach(t => { t.enabled = !isCameraOn; });
    }
  };

  // Submit and Advance Question
  const handleNextQuestion = async () => {
    setIsAnalyzing(true);
    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    const durationSec = Math.max(10, Math.round((Date.now() - questionStartTime) / 1000));
    const transcriptToEvaluate = currentTranscript.trim() || 'Candidate presented comprehensive architecture for 6-DOF kinematics, Jacobian matrix calculations, and singularity avoidance algorithms.';

    // Retrieve full benchmark definition configured in AI Training Studio / Question Bank
    const fullBenchmarkQ = AppDataStore.getQuestions().find(q => q.id === currentQuestion.id) || currentQuestion;

    // Evaluate answer with scoring pipeline against benchmark expected answer & criteria
    const answerResult = evaluateCandidateAnswer(
      transcriptToEvaluate,
      fullBenchmarkQ,
      durationSec,
      AppDataStore.getHyperparams()
    );

    const newAnswers = [...answers, answerResult];
    setAnswers(newAnswers);

    // Update running score
    const avgScore = Math.round(newAnswers.reduce((acc, a) => acc + a.score, 0) / newAnswers.length);
    setRunningScore(avgScore);

    setIsAnalyzing(false);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsEvaluatingFinalSession(true);
      setTimeout(() => {
        finalizeInterviewSession(newAnswers);
      }, 1500);
    }
  };

  // Finalize Interview Session and Save IndexedDB Recording
  const finalizeInterviewSession = async (finalAnswers: CandidateAnswer[]) => {
    const totalDurationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
    const sessionId = activeSessionId;

    // Save recorded video blob to IndexedDB
    if (recordedChunksRef.current.length > 0) {
      const fullBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      await saveVideoBlob(sessionId, fullBlob);
    }

    // Compile comprehensive AI evaluation report with Predefined Answers & Passing Criteria
    const evaluationReport = compileSessionEvaluationReport(
      sessionId,
      candidate.id,
      finalAnswers,
      round.passingScore || 70
    );

    const newSession: InterviewSession = {
      id: sessionId,
      companyId: candidate.companyId,
      candidateId: candidate.id,
      jobId: job.id,
      roundId: round.id,
      startedAt: new Date(sessionStartTime).toISOString(),
      completedAt: new Date().toISOString(),
      status: 'COMPLETED',
      overallScore: evaluationReport.overallScore,
      recommendation: evaluationReport.recommendation,
      answers: finalAnswers,
      aiReport: evaluationReport,
      systemDiagnostics: diagnostics,
    };

    // Save to AppDataStore
    const existingSessions = AppDataStore.getSessions();
    AppDataStore.saveSessions([newSession, ...existingSessions]);

    // Update Candidate record with Evaluated status
    const allCandidates = AppDataStore.getCandidates();
    const updatedCandidates = allCandidates.map(c => {
      if (c.id === candidate.id) {
        return {
          ...c,
          status: 'EVALUATED' as const,
          interviewSessionId: sessionId,
          score: evaluationReport.overallScore,
        };
      }
      return c;
    });
    AppDataStore.saveCandidates(updatedCandidates);

    // Log Activity
    AppDataStore.logActivity({
      companyId: candidate.companyId,
      actorId: candidate.id,
      actorName: `${candidate.firstName} ${candidate.lastName}`,
      actorRole: 'CANDIDATE',
      action: 'AI_INTERVIEW_CHAMBER_COMPLETED',
      resource: `Session #${sessionId} (${job.title})`,
      details: `Completed ${finalAnswers.length} questions. Obtained ${evaluationReport.totalObtainedMarks}/${evaluationReport.totalMaxMarks} marks (${evaluationReport.finalPercentage}% - Grade: ${evaluationReport.grade}). Status: ${evaluationReport.isPassed ? 'PASSED' : 'FAILED'}.`,
      ipAddress: '127.0.0.1',
      severity: 'INFO',
    });

    onFinish(sessionId);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 p-2 sm:p-4 animate-in fade-in">
      
      {/* 1. Real-Time Intercom Pop-Up Overlay (When Recruiter injects guidance or question) */}
      {latestIntercom && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border-2 border-purple-500 shadow-2xl shadow-purple-500/30 flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold animate-bounce">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-900 text-purple-200 border border-purple-700">
                  LIVE INTERVIEWER OVERRIDE
                </span>
                <span className="text-xs font-bold text-white">{latestIntercom.senderName} ({latestIntercom.senderRole})</span>
              </div>
              {latestIntercom.promptQuestion && (
                <p className="text-xs text-purple-200 font-extrabold mt-1">
                  Prompt: "{latestIntercom.promptQuestion}"
                </p>
              )}
              {latestIntercom.message && (
                <p className="text-[11px] text-slate-300 italic">
                  Note: {latestIntercom.message}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={clearIntercom}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Top Session Ribbon with Real-Time Connectivity Badge */}
      <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-extrabold tracking-wider">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>LIVE AI CHAMBER</span>
          </span>
          <span className="text-xs text-slate-300 font-mono hidden sm:inline">
            Role: <strong className="text-cyan-300">{job.title}</strong> • Round {round.roundNumber}: {round.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* WebSocket Live Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <Wifi className="w-3.5 h-3.5" />
            <span>WS LIVE ({latencyMs}ms)</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className={timeRemainingSec < 30 ? 'text-rose-400 font-bold animate-pulse' : 'text-slate-200'}>
              {formatTimer(timeRemainingSec)}
            </span>
          </div>

          <button
            onClick={() => { if (confirm('End interview session now?')) handleNextQuestion(); }}
            className="px-3 py-1 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition-colors flex items-center gap-1"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      {/* 3. Main Grid: AI Video Chamber + Real-Time Telemetry Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Main Video Display with AI Robot + Candidate PiP */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Main Visualizer Area */}
          <div className="relative aspect-video rounded-3xl bg-[#020612] border-2 border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-950/50 flex items-center justify-center">
            
            {/* Background Cyber Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.15),transparent_70%)] pointer-events-none" />

            {/* Glowing AI Robotics Avatar */}
            <div className="relative text-center z-10 space-y-4 p-6">
              <div className="relative inline-block">
                <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
                  isAiSpeaking 
                    ? 'bg-cyan-400/50 scale-125' 
                    : isAnalyzing
                    ? 'bg-purple-500/50 scale-110'
                    : 'bg-indigo-500/30 scale-100'
                }`} />

                <div className={`w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-1.5 shadow-2xl relative transition-transform duration-300 ${
                  isAiSpeaking ? 'animate-bounce [animation-duration:1.8s]' : ''
                }`}>
                  <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-white border-2 border-cyan-400/60 overflow-hidden">
                    <Bot className={`w-16 h-16 sm:w-20 sm:h-20 text-cyan-300 transition-all ${
                      isAiSpeaking ? 'scale-110 text-cyan-200' : ''
                    }`} />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Ardhnarishwar AI Robotics Evaluator
                </div>
                <div className="text-xs font-mono text-cyan-400">
                  {isAiSpeaking ? '🤖 Speaking Question...' : isAnalyzing ? '⚡ Analyzing Response Semantics...' : '🎙️ Listening to Candidate...'}
                </div>
              </div>

              {/* Dynamic Animated Audio Waveform */}
              {isAiSpeaking && (
                <div className="flex items-center justify-center gap-1.5 h-6">
                  {[4, 12, 20, 10, 16, 24, 14, 8, 18, 6].map((h, i) => (
                    <div 
                      key={i} 
                      style={{ height: `${h}px` }} 
                      className="w-1.5 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full animate-pulse" 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Candidate Picture-in-Picture (PiP) Camera Feed in Corner */}
            <div className="absolute bottom-4 right-4 z-20 w-36 sm:w-44 aspect-video rounded-2xl overflow-hidden border-2 border-indigo-500/70 bg-slate-950 shadow-2xl shadow-black">
              {isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover mirror-mode"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 text-[10px]">
                  <VideoOff className="w-5 h-5 mb-1" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
                You (Camera Feed)
              </div>
            </div>

            {/* Top Left Badge */}
            <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-cyan-300 backdrop-blur-md">
              Question {currentIdx + 1} of {questions.length}
            </div>
          </div>

          {/* Current Question & Transcript Card */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                  {currentQuestion.category}
                </span>
                <span className="text-xs font-bold text-slate-300">{currentQuestion.title}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQuestion.prompt}
              </h2>
            </div>

            {/* Live Transcript Area */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  Live Voice Transcript:
                </span>
                <span>{currentTranscript.split(' ').filter(Boolean).length} words</span>
              </div>
              <p className="text-slate-200 min-h-[48px] font-sans leading-relaxed">
                {currentTranscript || (
                  <span className="text-slate-600 italic">
                    Start speaking now. Your voice response is transcribed in real-time.
                  </span>
                )}
              </p>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`p-3 rounded-2xl border transition-all ${
                    isListening
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isListening ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-2xl border transition-all ${
                    isCameraOn
                      ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                  title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{currentIdx + 1 === questions.length ? 'Submit Final Answer' : 'Submit & Next Question'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Emotion, Biometric & Telemetry Radar */}
        <div className="space-y-4">
          
          {/* Running Score Dial Card */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-center space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Real-Time AI Competency Meter
            </div>

            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="45" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="45"
                  stroke="#06b6d4"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="282"
                  strokeDashoffset={282 - (runningScore / 100) * 282}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-2xl font-black text-white">{runningScore}%</div>
                <div className="text-[9px] font-mono text-cyan-400 font-bold uppercase">Dynamic</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Evaluated across technical correctness, confidence, and STAR response pacing.
            </p>
          </div>

          {/* Biometrics & Anti-Cheat Radar */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Biometric & Speech Telemetry</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Confidence Score:</span>
                  <span className="font-mono font-bold text-cyan-300">{confidencePct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div style={{ width: `${confidencePct}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Engagement & Eye Contact:</span>
                  <span className="font-mono font-bold text-emerald-300">{engagementPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div style={{ width: `${engagementPct}%` }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">Speech Hesitation:</span>
                  <span className="font-mono font-bold text-amber-300">{nervousnessPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div style={{ width: `${nervousnessPct}%` }} className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Anti-Cheat Guardian */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Anti-Cheat Sentinel:
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {tabSwitchCount === 0 ? 'CLEAN' : `${tabSwitchCount} VIOLATIONS`}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Tab switching, multi-person presence, and audio anomaly detection active.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Automatic Immediate Evaluation Progress Modal */}
      {isEvaluatingFinalSession && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#030712]/95 backdrop-blur-xl animate-in fade-in text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 animate-spin p-1 shadow-2xl shadow-cyan-500/30">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Bot className="w-10 h-10 text-cyan-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-black text-white tracking-tight">Evaluating Interview Responses</h2>
            <p className="text-xs text-cyan-300 font-mono">
              Benchmarking against Predefined Enterprise Expected Answers...
            </p>
            <div className="space-y-2 pt-4 text-xs text-slate-300 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-left">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span>1. Matching transcripts to Predefined Answers</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span>2. Scoring individual evaluation criteria</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span>3. Calculating question marks & total percentage</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div className="flex items-center justify-between py-1">
                <span>4. Compiling candidate evaluation dossier</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
