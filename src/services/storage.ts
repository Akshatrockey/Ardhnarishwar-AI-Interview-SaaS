// Persistent Client-Side Data Store & IndexedDB Video Chunk Manager
import { Company, User, JobPosition, InterviewRound, Question, Candidate, InterviewSession, AuditLog, SubscriptionPlan, AIEngineHyperparams } from '../types';
import { INITIAL_COMPANIES, INITIAL_USERS, INITIAL_JOBS, INITIAL_ROUNDS, ALL_INITIAL_QUESTIONS, INITIAL_CANDIDATES, INITIAL_SESSIONS, INITIAL_AUDIT_LOGS, SUBSCRIPTION_PLANS } from '../ai-engine/datasets/seedData';
import { DEFAULT_AI_HYPERPARAMS } from '../ai-engine/scoringPipeline';

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

// LocalStorage helpers with automatic seeding
function getStored<T>(key: string, defaultVal: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    }
    const item = memoryStore.get(key);
    return item ? JSON.parse(item) : defaultVal;
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
  // Initialize and ensure seed data is present
  static init(): void {
    if (!getStored(STORAGE_KEYS.COMPANIES, null)) {
      setStored(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    }
    if (!getStored(STORAGE_KEYS.USERS, null)) {
      setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
    if (!getStored(STORAGE_KEYS.JOBS, null)) {
      setStored(STORAGE_KEYS.JOBS, INITIAL_JOBS);
    }
    if (!getStored(STORAGE_KEYS.ROUNDS, null)) {
      setStored(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
    }
    if (!getStored(STORAGE_KEYS.QUESTIONS, null)) {
      setStored(STORAGE_KEYS.QUESTIONS, ALL_INITIAL_QUESTIONS);
    }
    if (!getStored(STORAGE_KEYS.CANDIDATES, null)) {
      setStored(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES);
    }
    if (!getStored(STORAGE_KEYS.SESSIONS, null)) {
      setStored(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    }
    if (!getStored(STORAGE_KEYS.AUDIT_LOGS, null)) {
      setStored(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    }
    if (!getStored(STORAGE_KEYS.PLANS, null)) {
      setStored(STORAGE_KEYS.PLANS, SUBSCRIPTION_PLANS);
    }
    if (!getStored(STORAGE_KEYS.HYPERPARAMS, null)) {
      setStored(STORAGE_KEYS.HYPERPARAMS, DEFAULT_AI_HYPERPARAMS);
    }
  }

  // Companies
  static getCompanies(): Company[] {
    return getStored<Company[]>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
  }
  static saveCompanies(companies: Company[]): void {
    setStored(STORAGE_KEYS.COMPANIES, companies);
  }

  // Users
  static getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  static saveUsers(users: User[]): void {
    setStored(STORAGE_KEYS.USERS, users);
  }

  // Jobs
  static getJobs(): JobPosition[] {
    return getStored<JobPosition[]>(STORAGE_KEYS.JOBS, INITIAL_JOBS);
  }
  static saveJobs(jobs: JobPosition[]): void {
    setStored(STORAGE_KEYS.JOBS, jobs);
  }

  // Rounds
  static getRounds(): InterviewRound[] {
    return getStored<InterviewRound[]>(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS);
  }
  static saveRounds(rounds: InterviewRound[]): void {
    setStored(STORAGE_KEYS.ROUNDS, rounds);
  }

  // Questions
  static getQuestions(): Question[] {
    return getStored<Question[]>(STORAGE_KEYS.QUESTIONS, ALL_INITIAL_QUESTIONS);
  }
  static saveQuestions(questions: Question[]): void {
    setStored(STORAGE_KEYS.QUESTIONS, questions);
  }

  // Candidates
  static getCandidates(): Candidate[] {
    return getStored<Candidate[]>(STORAGE_KEYS.CANDIDATES, INITIAL_CANDIDATES);
  }
  static saveCandidates(candidates: Candidate[]): void {
    setStored(STORAGE_KEYS.CANDIDATES, candidates);
  }

  // Sessions
  static getSessions(): InterviewSession[] {
    return getStored<InterviewSession[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  }
  static saveSessions(sessions: InterviewSession[]): void {
    setStored(STORAGE_KEYS.SESSIONS, sessions);
  }

  // Audit Logs
  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
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
    localStorage.clear();
    this.init();
  }
}
