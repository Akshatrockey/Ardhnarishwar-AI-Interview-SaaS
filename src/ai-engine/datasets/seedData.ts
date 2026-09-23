import { Company, User, JobPosition, InterviewRound, Question, Candidate, InterviewSession, AuditLog, SubscriptionPlan } from '../../types';
import { ROBOTICS_QUESTION_DATASET } from './roboticsQuestions';
import { SOFTWARE_QUESTION_DATASET } from './softwareQuestions';
import { HR_BEHAVIORAL_QUESTION_DATASET } from './hrBehavioralQuestions';

export const ALL_INITIAL_QUESTIONS: Question[] = [
  ...ROBOTICS_QUESTION_DATASET,
  ...SOFTWARE_QUESTION_DATASET,
  ...HR_BEHAVIORAL_QUESTION_DATASET,
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_ardhnarishwar',
    name: 'Ardhnarishwar AI Technologies',
    slug: 'ardhnarishwar',
    domain: 'ardhnarishwar.ai',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    plan: 'ENTERPRISE_ROBOTICS',
    status: 'ACTIVE',
    maxJobs: 999,
    maxCandidatesPerMonth: 50000,
    createdAt: '2026-01-01T00:00:00.000Z',
    contactEmail: 'hq@ardhnarishwar.ai',
    contactPerson: 'Platform Administrator',
    industry: 'Autonomous AI & Robotics SaaS',
    aiCustomRulesEnabled: true,
    recordingStorageUsedMb: 0,
    recordingStorageQuotaMb: 100000,
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_super_admin',
    email: 'admin@ardhnarishwar.ai',
    name: 'Ardhnarishwar Super Admin',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLogin: '2026-02-28T09:40:00.000Z',
    designation: 'Global Platform Architect',
    status: 'ACTIVE',
  }
];

export const INITIAL_JOBS: JobPosition[] = [];

export const INITIAL_ROUNDS: InterviewRound[] = [];

export const INITIAL_CANDIDATES: Candidate[] = [];

export const INITIAL_SESSIONS: InterviewSession[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'STARTER',
    name: 'Robotics Starter',
    pricePerMonth: 499,
    billingCycle: 'MONTHLY',
    maxJobs: 5,
    maxCandidatesPerMonth: 100,
    customQuestions: false,
    aiModelTuning: false,
    dedicatedSupport: false,
    whiteLabeling: false,
    videoStorageDays: 30,
    features: [
      'Up to 5 Active Job Postings',
      '100 AI Candidate Evaluations/mo',
      'Standard Question Bank',
      'Video & Audio Recording',
      'WebRTC Hardware Diagnostic',
      'Basic PDF Dossier Export'
    ]
  },
  {
    id: 'GROWTH',
    name: 'Growth Scale',
    pricePerMonth: 1499,
    billingCycle: 'MONTHLY',
    maxJobs: 20,
    maxCandidatesPerMonth: 500,
    customQuestions: true,
    aiModelTuning: false,
    dedicatedSupport: true,
    whiteLabeling: false,
    videoStorageDays: 90,
    features: [
      'Up to 20 Active Job Postings',
      '500 AI Candidate Evaluations/mo',
      'Custom Company Question Banks',
      'Advanced STAR & Fluency Scoring',
      'Clickable Question Timeline Replay',
      'Role-Based Recruiter Permissions',
      'Priority Email & Slack Support'
    ]
  },
  {
    id: 'ENTERPRISE_ROBOTICS',
    name: 'Enterprise Robotics Suite',
    pricePerMonth: 3999,
    billingCycle: 'MONTHLY',
    maxJobs: 999,
    maxCandidatesPerMonth: 10000,
    customQuestions: true,
    aiModelTuning: true,
    dedicatedSupport: true,
    whiteLabeling: true,
    videoStorageDays: 365,
    features: [
      'Unlimited Job Postings & Rounds',
      '10,000+ AI Evaluations/mo',
      'Custom AI Rubrics & Weight Tuning',
      'Full Multi-Tenant Audit Trails',
      'Military-Grade Video Proctoring',
      'Custom Domain & White-Labeling',
      '24/7 Dedicated Solutions Engineer',
      'On-Premise / Hybrid Storage Support'
    ]
  }
];
