export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'RECRUITER' | 'CANDIDATE' | 'EMPLOYEE';

export type ThemeMode = 'cyber-dark' | 'matrix-emerald' | 'sunset-nebula' | 'enterprise-light';

export type PlanType = 'STARTER' | 'GROWTH' | 'ENTERPRISE_ROBOTICS';
export type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'SUSPENDED';

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo?: string;
  plan: PlanType;
  status: CompanyStatus;
  maxJobs: number;
  maxCandidatesPerMonth: number;
  createdAt: string;
  contactEmail: string;
  contactPerson: string;
  industry: string;
  bio?: string;
  headquarters?: string;
  website?: string;
  phone?: string;
  employeeCount?: number;
  aiCustomRulesEnabled: boolean;
  recordingStorageUsedMb: number;
  recordingStorageQuotaMb: number;
  meetingRoomId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string; // null for Super Admin
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  designation?: string;
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  bio?: string;
  department?: string;
  location?: string;
  meetingRoomId?: string;
  employeeCode?: string;
  shiftId?: string;
  totalPunchHours?: number;
  assignedInterviewsCount?: number;
  skills?: string[];
}

export type JobStatus = 'OPEN' | 'CLOSED' | 'DRAFT';
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'PRINCIPAL';

export interface JobPosition {
  id: string;
  companyId: string;
  title: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'CONTRACT' | 'REMOTE' | 'HYBRID';
  experienceLevel: ExperienceLevel;
  description: string;
  requiredSkills: string[];
  status: JobStatus;
  createdAt: string;
  roundIds: string[];
  totalApplicants: number;
}

export type RoundType = 
  | 'AI_SCREENING'
  | 'TECHNICAL_ROBOTICS'
  | 'SOFTWARE_SYSTEMS'
  | 'HR_BEHAVIORAL'
  | 'LEADERSHIP_PROBLEM_SOLVING';

export interface InterviewRound {
  id: string;
  companyId: string;
  jobId: string;
  name: string;
  roundNumber: number;
  type: RoundType;
  timeLimitMinutes: number;
  questionIds: string[];
  passingScore: number;
  allowRetake: boolean;
  proctoringStrictness: 'STANDARD' | 'STRICT' | 'MILITARY_GRADE';
}

export type QuestionCategory = 
  | 'TECHNICAL'
  | 'HR'
  | 'BEHAVIORAL'
  | 'PROBLEM_SOLVING'
  | 'ROBOTICS_HARDWARE'
  | 'CONTROL_SYSTEMS'
  | 'EMBEDDED_C_CPP';

export interface QuestionRubric {
  relevanceWeight: number;       // 0-1
  technicalWeight: number;       // 0-1
  communicationWeight: number;   // 0-1
  problemSolvingWeight: number;  // 0-1
  confidenceWeight: number;      // 0-1
}

export interface Question {
  id: string;
  category: QuestionCategory;
  roleCategory: string; // e.g. "Robotics Engineer", "AI/ML", "ROS2 Developer"
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  title: string;
  prompt: string;
  expectedDurationSec: number;
  idealBenchmarkAnswer: string;
  keyConcepts: string[];
  antiPatterns: string[];
  rubric: QuestionRubric;
  isGlobal: boolean;
  companyId?: string; // null for Super Admin global bank
  createdAt: string;
}

export type CandidateStatus = 
  | 'INVITED'
  | 'IN_PROGRESS'
  | 'EVALUATED'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'HIRED';

export interface Candidate {
  id: string;
  companyId: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentTitle?: string;
  yearsOfExperience: number;
  status: CandidateStatus;
  interviewToken: string;
  appliedAt: string;
  interviewSessionId?: string;
  resumeFileName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  skills?: string[];
  education?: string;
  meetingRoomId?: string;
  score?: number;
}

export interface DimensionScores {
  relevance: number;        // 0-100
  technicalDepth: number;   // 0-100
  communication: number;    // 0-100
  problemSolving: number;   // 0-100
  confidence: number;       // 0-100
  roleCompetency: number;   // 0-100
}

export interface CandidateAnswer {
  questionId: string;
  questionTitle: string;
  category: QuestionCategory;
  videoTimestampStart: number; // in seconds from start
  videoTimestampEnd: number;
  transcript: string;
  durationSec: number;
  score: number; // 0-100 overall for this question
  feedback: string;
  dimensionScores: DimensionScores;
  keyConceptsIdentified: string[];
  missingConcepts: string[];
  fillerWordCount: number;
  wpm: number;
  speechHesitationRatio: number;
}

export type HiringRecommendation = 
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'LEANING_HIRE'
  | 'LEANING_NO_HIRE'
  | 'STRONG_NO_HIRE';

export interface AIModelVersion {
  id: string;
  versionTag: string;
  name: string;
  description?: string;
  datasetRef: string;
  datasetVersion: string;
  datasetChecksum: string;
  scoringConfig: {
    weights: {
      technical: number;
      relevance: number;
      communication: number;
      problemSolving: number;
      confidence: number;
      roleCompetency: number;
    };
    passingThreshold: number;
  };
  featureConfig: {
    ngramRange: [number, number];
    minWpm: number;
    maxWpm: number;
    hesitationWeight: number;
  };
  ruleConfig: {
    antiPatternPenalty: number;
    starWeights: {
      situation: number;
      task: number;
      action: number;
      result: number;
    };
    confidenceBaseline: number;
  };
  evaluationMetrics: {
    validationAccuracy: number;
    f1Score: number;
    benchmarkRmse: number;
  };
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface AIEvaluationReport {
  id: string;
  sessionId: string;
  candidateId: string;
  aiModelVersionId?: string;
  overallScore: number;
  dimensionScores: DimensionScores;
  recommendation: HiringRecommendation;
  strengths: string[];
  weaknesses: string[];
  redFlags: string[];
  executiveSummary: string;
  starStructureAnalysis?: {
    situationClarity: number;
    taskRelevance: number;
    actionExecution: number;
    resultImpact: number;
  };
  modelVersionSnapshot: {
    versionTag: string;
    datasetRef: string;
    datasetVersion: string;
    scoringWeights: Record<string, number>;
    antiPatternPenalty: number;
  };
  reproducibilityHash: string;
  generatedAt: string;
}

export interface InterviewSession {
  id: string;
  companyId: string;
  candidateId: string;
  jobId: string;
  roundId: string;
  startedAt?: string;
  completedAt?: string;
  status: 'SCHEDULED' | 'RECORDING' | 'ANALYZING' | 'COMPLETED' | 'ABANDONED';
  videoUrl?: string;
  audioUrl?: string;
  overallScore?: number;
  recommendation?: HiringRecommendation;
  answers: CandidateAnswer[];
  aiReport?: AIEvaluationReport;
  systemDiagnostics?: {
    cameraModel: string;
    micWorking: boolean;
    networkLatencyMs: number;
    browserAgent: string;
  };
}

export interface AuditLog {
  id: string;
  companyId?: string;
  companyName?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  pricePerMonth: number;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  maxJobs: number;
  maxCandidatesPerMonth: number;
  customQuestions: boolean;
  aiModelTuning: boolean;
  dedicatedSupport: boolean;
  whiteLabeling: boolean;
  videoStorageDays: number;
  features: string[];
}

export interface AIEngineHyperparams {
  semanticThreshold: number;       // 0.0 - 1.0 (default: 0.65)
  fillerWordPenalization: number;   // 0.0 - 0.2 (default: 0.05)
  conceptDensityMultiplier: number; // 1.0 - 2.0 (default: 1.2)
  fluencyOptimalWpmMin: number;     // e.g. 110
  fluencyOptimalWpmMax: number;     // e.g. 165
  starMethodStrictness: number;     // 0.0 - 1.0
  customAntiPatternDeduction: number;
}

// Real-Time WebSocket & Event Protocol Types
export type RealtimeMessageType = 
  | 'INTERVIEW_TELEMETRY'
  | 'PROCTORING_FLAG'
  | 'RECRUITER_INTERCOM'
  | 'SUPER_ADMIN_BROADCAST'
  | 'VIDEO_MEETING_SIGNAL'
  | 'PRESENCE_SYNC'
  | 'PING'
  | 'PONG';

export interface RealtimeTelemetry {
  candidateId: string;
  candidateName: string;
  sessionId: string;
  companyId: string;
  questionIndex: number;
  questionTitle: string;
  wpm: number;
  confidencePct: number;
  audioVolume: number;
  faceVisible: boolean;
  isAiSpeaking: boolean;
  liveTranscriptChunk?: string;
  runningScore?: number;
  timestamp: number;
}

export interface RealtimeProctorFlag {
  id: string;
  candidateId: string;
  candidateName: string;
  companyId: string;
  sessionId: string;
  type: 'TAB_SWITCH' | 'MULTI_FACE' | 'NO_FACE' | 'AUDIO_ANOMALY' | 'DEVTOOLS_OPEN';
  message: string;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: string;
}

export interface RealtimeIntercomMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  targetCandidateId: string;
  message: string;
  promptQuestion?: string;
  timestamp: string;
}

export interface RealtimeBroadcast {
  id: string;
  senderId: string;
  senderName: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'EMERGENCY';
  targetRole?: UserRole | 'ALL';
  targetCompanyId?: string | 'ALL';
  timestamp: string;
}

export interface VideoMeetingInvite {
  roomId: string;
  hostName: string;
  hostRole: UserRole;
  candidateName?: string;
  jobTitle?: string;
  companyName?: string;
  scheduledTime?: string;
}

export interface RealtimeMessage<T = any> {
  type: RealtimeMessageType;
  senderId: string;
  senderRole: UserRole;
  targetRoom?: string;
  payload: T;
  timestamp: number;
}
