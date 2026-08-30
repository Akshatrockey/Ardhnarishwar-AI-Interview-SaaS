// Explainable AI Feedback & Qualitative Assessment Generator for Ardhnarishwar Core-AI
import { Question, DimensionScores, HiringRecommendation } from '../types';
import { FluencyMetrics } from './fluencyAnalyzer';

export function generateQuestionFeedback(
  question: Question,
  scores: DimensionScores,
  identifiedConcepts: string[],
  missingConcepts: string[],
  antiPatterns: string[],
  fluency: FluencyMetrics
): string {
  const parts: string[] = [];

  // 1. Category-aware Assessment
  if (question.category === 'BEHAVIORAL' || question.category === 'HR') {
    if (scores.problemSolving >= 75) {
      parts.push(`Demonstrates strong STAR structure with clear situation framing, collaborative action, and quantifiable outcome.`);
    } else {
      parts.push(`Behavioral response could be strengthened by detailing specific personal actions and quantifiable outcomes.`);
    }
  } else {
    if (scores.technicalDepth >= 80) {
      parts.push(`Strong conceptual grasp. Covered core principles: ${identifiedConcepts.slice(0, 3).join(', ')}.`);
    } else if (scores.technicalDepth >= 60) {
      parts.push(`Adequate baseline understanding. Identified ${identifiedConcepts.length} key concepts, but missed key depth in: ${missingConcepts.slice(0, 2).join(', ')}.`);
    } else {
      parts.push(`Lacks technical rigor. Missed critical domain fundamentals: ${missingConcepts.slice(0, 3).join(', ')}.`);
    }
  }

  // 2. Anti-patterns
  if (antiPatterns.length > 0) {
    parts.push(`⚠️ Detected problematic pattern: "${antiPatterns.join(', ')}".`);
  }

  // 3. Communication & Delivery
  if (fluency.fillerWordCount > 5) {
    parts.push(`Speech showed pacing hesitation with ${fluency.fillerWordCount} filler words detected.`);
  } else if (fluency.clarityScore >= 85) {
    parts.push(`Delivered concisely at ${fluency.wpm} WPM with crisp sentence structure.`);
  }

  return parts.join(' ');
}

export function generateExecutiveSummary(
  overallScore: number,
  scores: DimensionScores,
  recommendation: HiringRecommendation,
  identifiedConcepts: string[],
  missingConcepts: string[]
): string {
  let recText = '';
  switch (recommendation) {
    case 'STRONG_HIRE':
      recText = 'Candidate demonstrates exceptional domain mastery, crisp structural communication, and robust problem-solving capabilities suitable for high-impact engineering leadership.';
      break;
    case 'HIRE':
      recText = 'Candidate shows a solid engineering foundation with strong technical competency and good problem-solving discipline.';
      break;
    case 'LEANING_HIRE':
      recText = 'Candidate possesses good potential and foundational knowledge, but exhibits minor gaps in specialized concepts that can be bridged with team onboarding.';
      break;
    case 'LEANING_NO_HIRE':
      recText = 'Candidate fell below the target threshold in technical depth and solution structuring, requiring further seasoning in enterprise robotics/systems.';
      break;
    case 'STRONG_NO_HIRE':
      recText = 'Candidate demonstrated significant gaps across key technical competencies and communication criteria required for this role.';
      break;
  }

  const technicalSummary = `Scored ${scores.technicalDepth}/100 on Technical Rigor, validating understanding in ${identifiedConcepts.slice(0, 4).join(', ') || 'general concepts'}.`;
  const commSummary = `Scored ${scores.communication}/100 in Communication and ${scores.confidence}/100 in Confidence delivery.`;

  return `${recText} ${technicalSummary} ${commSummary}`;
}
