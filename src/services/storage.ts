// Persistent Client-Side Data Store & IndexedDB Video Chunk Manager (Production Real-Time)
import { Company, User, JobPosition, InterviewRound, Question, Candidate, InterviewSession, AuditLog, SubscriptionPlan, AIEngineHyperparams } from '../types';
import { DEFAULT_AI_HYPERPARAMS } from '../ai-engine/scoringPipeline';
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_JOBS,
  INITIAL_ROUNDS,
  ALL_INITIAL_QUESTIONS,
  INITIAL_CANDIDATES,
  INITIAL_SESSIONS,
  INITIAL_AUDIT_LOGS,
} from '../ai-engine/datasets/seedData';

/**
 * Universal cross-browser copy to clipboard with fallback for unsecured contexts and iframes
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('navigator.clipboard failed, using fallback execCommand:', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy text using fallback:', err);
    return false;
  }
}

const STORAGE_KEYS = {
  COMPANIES: 'ardhnarishwar_companies_v1',
  USERS: 'ardhnarishwar_users_v1',
  JOBS: 'ardhnarishwar_jobs_v1',
  ROUNDS: 'ardhnarishwar_rounds_v1',
  QUESTIONS: 'ardhnarishwar_questions_v1',
  CANDIDATES: 'ardhnarishwar_candidates_v1',
  SESSIONS: 'ardhnarishwar_sessions_v1',
  AUDIT_LOGS: 'ardhnarishwar_audit_logs_v1',
  PLANS: 'ardhnarishwar_plans_v1',
  HYPERPARAMS: 'ardhnarishwar_ai_hyperparams_v1',
};

// IndexedDB setup for video chunk storage
const IDB_NAME = 'ArdhnarishwarMediaDB';
const IDB_VERSION = 1;
const IDB_STORE = 'video_recordings';

function openVideoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'sessionId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVideoBlob(sessionId: string, blob: Blob): Promise<void> {
  try {
    const db = await openVideoDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put({ sessionId, blob, timestamp: Date.now() });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save video to IndexedDB:', err);
  }
}

export async function getVideoBlob(sessionId: string): Promise<Blob | null> {
  try {
    const db = await openVideoDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const request = store.get(sessionId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result ? request.result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not read video from IndexedDB:', err);
    return null;
  }
}

const memoryStore = new Map<string, string>();

function getStored<T>(key: string, defaultVal: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : defaultVal;
    }
    const item = memoryStore.get(key);
    return item !== undefined ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    const serialized = JSON.stringify(val);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, serialized);
    } else {
      memoryStore.set(key, serialized);
    }
  } catch (e) {
    console.error('Storage quota exceeded or unavailable', e);
  }
}

export class AppDataStore {
  // Initialize production state with rich enterprise seed records when empty
  static init(): void {
    const storedCompanies = getStored<Company[] | null>(STORAGE_KEYS.COMPANIES, null);
    if (!storedCompanies || storedCompanies.length === 0) {
      setStored(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    }

    const storedUsers = getStored<User[] | null>(STORAGE_KEYS.USERS, null);
    if (!storedUsers || storedUsers.length === 0) {
      setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    }

    const storedJobs = getStored<JobPosition[] | null>(STORAGE_KEYS.JOBS, null);
    if (!storedJobs || storedJobs.length === 0) {
      setStored(STORAGE_KEYS.JOBS, INITIAL_JOBS);
    }

    const storedRounds = getStored<InterviewRound[] | null>(STORAGE_KEYS.ROUNDS, null);
    if (!storedRounds || storedRounds.length === 0) {
      setStored(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
    }

    const storedQuestions = getStored<Question[] | null>(STORAGE_KEYS.QUESTIONS, null);
    if (!storedQuestions || storedQuestions.length === 0) {
      setStored(STORAGE_KEYS.QUESTIONS, ALL_INITIAL_QUESTIONS);
    }

    const storedCandidates = getStored<Candidate[] | null>(STORAGE_KEYS.CANDIDATES, null);
    if (!storedCandidates || storedCandidates.length === 0) {
      setStored(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES);
    }

    const storedSessions = getStored<InterviewSession[] | null>(STORAGE_KEYS.SESSIONS, null);
    if (!storedSessions || storedSessions.length === 0) {
      setStored(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    }

    const storedAuditLogs = getStored<AuditLog[] | null>(STORAGE_KEYS.AUDIT_LOGS, null);
    if (!storedAuditLogs || storedAuditLogs.length === 0) {
      setStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    }

    if (getStored(STORAGE_KEYS.HYPERPARAMS, null) === null) {
      setStored(STORAGE_KEYS.HYPERPARAMS, DEFAULT_AI_HYPERPARAMS);
    }
  }

  // Companies
  static getCompanies(): Company[] {
    return getStored<Company[]>(STORAGE_KEYS.COMPANIES, []);
  }
  static saveCompanies(companies: Company[]): void {
    setStored(STORAGE_KEYS.COMPANIES, companies);
  }

  // Users
  static getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, []);
  }
  static saveUsers(users: User[]): void {
    setStored(STORAGE_KEYS.USERS, users);
  }

  // Jobs
  static getJobs(): JobPosition[] {
    return getStored<JobPosition[]>(STORAGE_KEYS.JOBS, []);
  }
  static saveJobs(jobs: JobPosition[]): void {
    setStored(STORAGE_KEYS.JOBS, jobs);
  }

  // Rounds
  static getRounds(): InterviewRound[] {
    return getStored<InterviewRound[]>(STORAGE_KEYS.ROUNDS, []);
  }
  static saveRounds(rounds: InterviewRound[]): void {
    setStored(STORAGE_KEYS.ROUNDS, rounds);
  }

  // Questions
  static getQuestions(): Question[] {
    return getStored<Question[]>(STORAGE_KEYS.QUESTIONS, []);
  }
  static saveQuestions(questions: Question[]): void {
    setStored(STORAGE_KEYS.QUESTIONS, questions);
  }

  // Candidate Security: Strip Expected Answer, Criteria, Keywords & Rubric for candidate chamber views
  static sanitizeQuestionForCandidate(
    q: Question
  ): Omit<
    Question,
    | 'expectedAnswer'
    | 'idealBenchmarkAnswer'
    | 'evaluationCriteria'
    | 'keyConcepts'
    | 'antiPatterns'
    | 'rubric'
  > {
    const {
      expectedAnswer,
      idealBenchmarkAnswer,
      evaluationCriteria,
      keyConcepts,
      antiPatterns,
      rubric,
      ...safeQuestion
    } = q;
    return safeQuestion;
  }

  static sanitizeQuestionsForCandidate(qs: Question[]): Question[] {
    return qs.map(q => this.sanitizeQuestionForCandidate(q) as unknown as Question);
  }

  // Candidates
  static getCandidates(): Candidate[] {
    return getStored<Candidate[]>(STORAGE_KEYS.CANDIDATES, []);
  }
  static saveCandidates(candidates: Candidate[]): void {
    setStored(STORAGE_KEYS.CANDIDATES, candidates);
  }

  // Sessions
  static getSessions(): InterviewSession[] {
    return getStored<InterviewSession[]>(STORAGE_KEYS.SESSIONS, []);
  }
  static saveSessions(sessions: InterviewSession[]): void {
    setStored(STORAGE_KEYS.SESSIONS, sessions);
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }
  static getActivityLogs(): AuditLog[] {
    return this.getAuditLogs();
  }
  static logActivity(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
  }

  // Hyperparams
  static getHyperparams(): AIEngineHyperparams {
    return getStored<AIEngineHyperparams>(STORAGE_KEYS.HYPERPARAMS, DEFAULT_AI_HYPERPARAMS);
  }
  static saveHyperparams(params: AIEngineHyperparams): void {
    setStored(STORAGE_KEYS.HYPERPARAMS, params);
  }

  // Reset storage to enterprise defaults
  static resetToDefault(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.COMPANIES);
      localStorage.removeItem(STORAGE_KEYS.JOBS);
      localStorage.removeItem(STORAGE_KEYS.ROUNDS);
      localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
      localStorage.removeItem(STORAGE_KEYS.CANDIDATES);
      localStorage.removeItem(STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    }
    this.init();
  }
}
