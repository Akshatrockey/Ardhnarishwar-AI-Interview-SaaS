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
  logoUrl?: string;
  logo_url?: string;
  legalName?: string;
  legal_name?: string;
  displayName?: string;
  display_name?: string;
  faviconUrl?: string;
  favicon_url?: string;
  brandAccentColor?: string;
  brand_accent_color?: string;
  website?: string;
  taxId?: string;
  tax_id?: string;
  companySize?: string;
  company_size?: string;
  description?: string;
  hqStreet?: string;
  hq_street?: string;
  hqCity?: string;
  hq_city?: string;
  hqState?: string;
  hq_state?: string;
  hqCountry?: string;
  hq_country?: string;
  hqPostalCode?: string;
  hq_postal_code?: string;
  phone?: string;
  contactEmail: string;
  contact_email?: string;
  contactPerson: string;
  contact_person?: string;
  supportEmail?: string;
  support_email?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  date_format?: string;
  workWeek?: string;
  work_week?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    portfolio?: string;
  };
  social_links?: Record<string, string>;
  dataRetentionDays?: number;
  data_retention_days?: number;
  defaultPermissions?: Record<string, boolean>;
  default_permissions?: Record<string, boolean>;
  securityContactEmail?: string;
  security_contact_email?: string;
  plan: PlanType;
  status: CompanyStatus;
  maxJobs: number;
  maxCandidatesPerMonth: number;
  createdAt: string;
  industry: string;
  bio?: string;
  headquarters?: string;
  employeeCount?: number;
  aiCustomRulesEnabled: boolean;
  recordingStorageUsedMb: number;
  recordingStorageQuotaMb: number;
  meetingRoomId?: string;
}

export interface AIModelOption {
  id: string;
  name: string;
  engine: 'anthropic' | 'gemini' | 'huggingface' | 'local';
  description: string;
  tier: string;
  is_configured: boolean;
  status: string;
  default_fallback?: boolean;
}

export interface VaultKeyMoment {
  timestamp: string;
  seconds: number;
  title: string;
  category: string;
  confidence: number;
  badge?: string;
}

export interface VaultIndexingData {
  session_id: string;
  indexing_status?: string;
  status?: string;
  indexed_at: number | string;
  duration_formatted?: string;
  duration_seconds?: number;
  video_url?: string;
  transcription?: Array<{ timestamp: string; seconds?: number; speaker: string; text: string }>;
  transcription_segments?: Array<{ timestamp?: string; seconds: number; speaker: string; text: string }>;
  key_moments: VaultKeyMoment[];
  behavioral_highlights: {
    eye_contact_ratio?: number;
    speaking_pace_wpm?: number;
    hesitation_ratio?: number;
    emotional_valence?: string;
    facial_focus_score?: number;
    confidence_score?: number;
    pacing_wpm?: number;
    star_framework_adherence?: number;
    summary?: string;
  };
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
export type SkillCategory = 'SKILLED' | 'UNSKILLED' | 'SEMI_SKILLED';

export interface JobPosition {
  id: string;
  companyId: string;
  title: string;
  department: string;
  location: string;
  type: 'FULL_TIME' | 'CONTRACT' | 'REMOTE' | 'HYBRID';
  experienceLevel: ExperienceLevel;
  skillCategory?: SkillCategory;
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
  | 'PRACTICAL_OPERATIONS'
  | 'GENERAL_APTITUDE'
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
  | 'PRACTICAL_SAFETY'
  | 'OPERATIONAL_WORKFLOW'
  | 'ROBOTICS_HARDWARE'
  | 'CONTROL_SYSTEMS'
  | 'EMBEDDED_C_CPP';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface QuestionRubric {
  relevanceWeight: number;       // 0-1
  technicalWeight: number;       // 0-1
  communicationWeight: number;   // 0-1
  problemSolvingWeight: number;  // 0-1
  confidenceWeight: number;      // 0-1
}

export type QuestionStatus = 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'EMPTY';

export type EvaluationGrade = 
  | 'EXCELLENT'
  | 'VERY_GOOD'
  | 'GOOD'
  | 'AVERAGE'
  | 'NEEDS_IMPROVEMENT';

export interface Question {
  id: string;
  category: QuestionCategory;
  roleCategory: string; // e.g. "Robotics Engineer", "Assembly Line Operator", "Warehouse Logistics"
  questionType?: string; // 'TECHNICAL' | 'BEHAVIORAL' | 'CONCEPTUAL' | 'CODING' | 'SYSTEM_DESIGN' | 'PRACTICAL' | 'HR'
  targetSkillLevel?: SkillCategory | 'ALL';
  difficulty: DifficultyLevel;
  title: string;
  prompt: string;
  expectedDurationSec: number;
  expectedAnswer: string; // REQUIRED predefined expected answer
  idealBenchmarkAnswer: string; // Backward compatibility alias
  evaluationCriteria: string[]; // REQUIRED evaluation criteria points
  keyConcepts: string[]; // Important keywords / concepts
  antiPatterns: string[];
  maxScore: number; // Configurable maximum score, e.g. 10 (default: 10)
  rubric: QuestionRubric;
  isGlobal: boolean;
  companyId?: string; // null for Super Admin global bank
  createdBy?: string;
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
  phone?: string;
  skillCategory?: SkillCategory;
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
  questionPrompt?: string;
  category: QuestionCategory;
  questionType?: string;
  videoTimestampStart: number; // in seconds from start
  videoTimestampEnd: number;
  transcript: string;
  durationSec: number;
  score: number; // 0-100 normalized overall for this question
  obtainedScore: number; // Marks obtained out of maxScore (e.g. 8.0)
  maxScore: number; // Maximum marks for this question (e.g. 10)
  status: QuestionStatus; // 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'EMPTY'
  evaluationReason: string; // Natural language explanation of why score was awarded
  feedback: string;
  strengths?: string[];
  improvementSuggestions?: string[];
  expectedAnswer?: string; // Predefined benchmark stored for HR / review dossier
  evaluationCriteria?: string[];
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
  overallScore: number; // 0-100
  totalObtainedMarks: number; // e.g. 42
  totalMaxMarks: number; // e.g. 50
  finalPercentage: number; // e.g. 84.0
  passingPercentage: number; // e.g. 70.0
  isPassed: boolean;
  grade: EvaluationGrade; // 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'AVERAGE' | 'NEEDS_IMPROVEMENT'
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
  | 'PANEL_CHAT'
  | 'LIVE_SCORE_CONSENSUS'
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

export type JobType = 'FULL_TIME' | 'CONTRACT' | 'REMOTE' | 'HYBRID';
export type QuestionType =
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'CONCEPTUAL'
  | 'CODING'
  | 'SYSTEM_DESIGN'
  | 'PRACTICAL'
  | 'HR';
export type SessionStatus = 'SCHEDULED' | 'RECORDING' | 'ANALYZING' | 'COMPLETED' | 'ABANDONED';
export type ProctoringFlag = RealtimeProctorFlag;

// ---------------------------------------------------------------------------
// Browser Media & Web Speech API Types
// ---------------------------------------------------------------------------
export interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface ISpeechRecognitionResult {
  readonly length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface ISpeechRecognitionResultList {
  readonly length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

export interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

export interface ISpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
}

export type ISpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

// ---------------------------------------------------------------------------
// Typed Backend API Payloads
// ---------------------------------------------------------------------------
export interface CreateJobPayload {
  companyId?: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  experienceLevel: ExperienceLevel;
  skillCategory: SkillCategory;
  location: string;
  jobType: JobType;
  roundIds: string[];
  maxCandidates: number;
  status: JobStatus;
}

export interface AddQuestionPayload {
  text: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  skillCategory?: SkillCategory;
  expectedKeywords?: string[];
  idealAnswer?: string;
  maxScore?: number;
}

export interface CompleteInterviewPayload {
  status?: SessionStatus;
  overallScore?: number;
  scores?: Record<string, number>;
  feedback?: string;
  proctoringFlags?: ProctoringFlag[];
  durationMinutes?: number;
}
