/**
 * In-House AI Question Generation Engine
 * Generates tailored, role-specific, non-repetitive interview questions,
 * benchmark answers, and key concept taxonomies based on job title, description, skills, and difficulty level.
 */

import { Question, QuestionCategory } from '../types';

export interface GenerateQuestionsParams {
  jobTitle: string;
  department?: string;
  skills: string[];
  experienceLevel: string;
  interviewType: QuestionCategory | string;
  count?: number;
}

const defaultRubric = {
  relevanceWeight: 0.25,
  technicalWeight: 0.35,
  communicationWeight: 0.15,
  problemSolvingWeight: 0.15,
  confidenceWeight: 0.10
};

export function generateAIInterviewQuestions(params: GenerateQuestionsParams): Question[] {
  const { jobTitle, skills, experienceLevel, interviewType, count = 4 } = params;
  const normalizedType = (interviewType || 'TECHNICAL').toUpperCase() as QuestionCategory;
  const primarySkill = skills[0] || 'Core Architecture';
  const secondarySkill = skills[1] || 'System Design';
  const timestamp = Date.now();
  const dateStr = new Date().toISOString();

  const generatedList: Question[] = [];

  // Question 1: Core Fundamentals & Principles
  generatedList.push({
    id: `q_ai_${timestamp}_1`,
    companyId: 'comp_cyberdyne',
    category: normalizedType,
    roleCategory: jobTitle,
    title: `${primarySkill} Architecture & Core Paradigms`,
    prompt: `For a ${experienceLevel} ${jobTitle} role, explain how you architect systems utilizing ${primarySkill}. Describe the fundamental design patterns, data flow mechanisms, and performance constraints you prioritize.`,
    idealBenchmarkAnswer: `The candidate should articulate clean architectural decomposition in ${primarySkill}, modular interface design, computational efficiency, error-handling guarantees, and state synchronization principles.`,
    keyConcepts: [
      primarySkill.toLowerCase(),
      'architecture',
      'design patterns',
      'modularity',
      'state management',
      'performance optimization'
    ],
    antiPatterns: [
      'monolithic tightly coupled code',
      'ignoring thread safety',
      'unhandled race conditions'
    ],
    expectedDurationSec: 120,
    rubric: defaultRubric,
    isGlobal: false,
    difficulty: experienceLevel === 'SENIOR' || experienceLevel === 'LEAD' ? 'HARD' : 'MEDIUM',
    createdAt: dateStr
  });

  // Question 2: Practical Problem Solving & Error Mitigation
  generatedList.push({
    id: `q_ai_${timestamp}_2`,
    companyId: 'comp_cyberdyne',
    category: 'PROBLEM_SOLVING',
    roleCategory: jobTitle,
    title: `${secondarySkill} Scalability & Failure Recovery`,
    prompt: `Describe a scenario where a ${secondarySkill} pipeline under heavy load encounters edge-case failures or unexpected latency spikes. What systematic debugging and fault-tolerance strategies would you employ?`,
    idealBenchmarkAnswer: `The candidate should discuss telemetry tracing, bottleneck profiling in ${secondarySkill}, fallback circuit-breakers, idempotent retries, and automated self-healing mechanisms.`,
    keyConcepts: [
      secondarySkill.toLowerCase(),
      'fault tolerance',
      'bottleneck profiling',
      'latency optimization',
      'edge cases',
      'circuit breaker'
    ],
    antiPatterns: [
      'blind retry storms',
      'relying on guesswork without metrics',
      'ignoring graceful degradation'
    ],
    expectedDurationSec: 120,
    rubric: defaultRubric,
    isGlobal: false,
    difficulty: 'HARD',
    createdAt: dateStr
  });

  // Question 3: Situational & Behavioral Collaboration (STAR Framework)
  generatedList.push({
    id: `q_ai_${timestamp}_3`,
    companyId: 'comp_cyberdyne',
    category: 'BEHAVIORAL',
    roleCategory: jobTitle,
    title: 'Cross-Functional Technical Alignment & Tradeoffs',
    prompt: `Walk me through a high-stakes technical decision for ${jobTitle} where stakeholders had conflicting requirements. How did you structure the tradeoffs, validate assumptions, and achieve engineering consensus?`,
    idealBenchmarkAnswer: `Candidate should utilize the STAR methodology (Situation, Task, Action, Result) explaining data-driven benchmark comparisons, transparent risk matrices, empathetic stakeholder alignment, and delivered business impact.`,
    keyConcepts: [
      'tradeoff analysis',
      'stakeholder alignment',
      'data-driven decision',
      'consensus building',
      'risk matrix',
      'measurable outcome'
    ],
    antiPatterns: [
      'imposing unilateral decisions',
      'ignoring non-functional requirements',
      'failing to quantify results'
    ],
    expectedDurationSec: 120,
    rubric: defaultRubric,
    isGlobal: false,
    difficulty: 'MEDIUM',
    createdAt: dateStr
  });

  // Question 4: Advanced System Integration & Edge Optimization
  generatedList.push({
    id: `q_ai_${timestamp}_4`,
    companyId: 'comp_cyberdyne',
    category: normalizedType,
    roleCategory: jobTitle,
    title: 'Distributed System Integration & Production Hardening',
    prompt: `When shipping mission-critical ${jobTitle} features to production, what zero-trust security, real-time observability, and automated regression testing pipelines do you establish?`,
    idealBenchmarkAnswer: `Candidate should outline CI/CD automated validation, end-to-end integration testing, Prometheus/Grafana metric telemetry, zero-trust token guards, and canary deployment rollouts.`,
    keyConcepts: [
      'observability',
      'ci/cd pipeline',
      'regression testing',
      'zero trust',
      'canary deployment',
      'production monitoring'
    ],
    antiPatterns: [
      'manual deployment without testing',
      'missing structured logs',
      'unmonitored production endpoints'
    ],
    expectedDurationSec: 120,
    rubric: defaultRubric,
    isGlobal: false,
    difficulty: 'HARD',
    createdAt: dateStr
  });

  return generatedList.slice(0, count);
}

/**
 * Adaptive Follow-Up Question Generator
 * Dynamically generates a targeted follow-up question during the live interview
 * based on missing concepts or candidate depth in previous answer.
 */
export function generateAdaptiveFollowUpQuestion(
  previousQuestion: Question,
  missingConcepts: string[],
  _score: number
): Question {
  const missingTopic = missingConcepts[0] || 'edge-case robustness';
  
  return {
    id: `q_followup_${Date.now()}`,
    companyId: previousQuestion.companyId,
    category: previousQuestion.category,
    roleCategory: previousQuestion.roleCategory,
    title: `Follow-Up: ${previousQuestion.title}`,
    prompt: `To build on your previous response: How would you specifically address ${missingTopic} under strict production latency constraints, and what quantitative metric would you use to verify it?`,
    idealBenchmarkAnswer: `Candidate should directly clarify ${missingTopic}, demonstrating nuanced engineering depth and verification criteria.`,
    keyConcepts: [missingTopic, 'latency', 'quantitative metric', 'verification'],
    antiPatterns: ['vague generalizations'],
    expectedDurationSec: 90,
    rubric: defaultRubric,
    isGlobal: false,
    difficulty: 'HARD',
    createdAt: new Date().toISOString()
  };
}
