// Concept Graph & Domain Terminology Density Matching for Ardhnarishwar Core-AI
import { cleanAndTokenize, simpleStem } from './tokenizer';

export interface ConceptMatchResult {
  identifiedConcepts: string[];
  missingConcepts: string[];
  conceptCoverageScore: number; // 0-100
  antiPatternsDetected: string[];
  technicalKeywordDensity: number;
}

// Predefined synonym clusters for interview evaluation (Allowing different wording / paraphrasing)
const SYNONYM_CLUSTERS: Record<string, string[]> = {
  communicate: ['communicate', 'communication', 'talk', 'transfers', 'transfer', 'exchange', 'interact', 'connecting', 'connect', 'send', 'link', 'bridge'],
  communication: ['communicate', 'communication', 'talk', 'transfers', 'transfer', 'exchange', 'interact', 'connecting', 'connect', 'send', 'link', 'bridge'],
  software: ['software', 'program', 'programs', 'application', 'applications', 'system', 'systems', 'service', 'services', 'platform', 'platforms'],
  interface: ['interface', 'api', 'bridge', 'contract', 'gateway', 'endpoint', 'intermediary'],
  data: ['data', 'information', 'payload', 'message', 'messages', 'content'],
  protocol: ['protocol', 'protocols', 'standard', 'standards', 'format', 'contract', 'endpoints', 'endpoint'],
  kinematics: ['kinematics', 'kinematic', 'jacobian', 'forward kinematics', 'inverse kinematics', 'joint space', 'cartesian', 'trajectory'],
  ros2: ['ros2', 'ros', 'nodes', 'node', 'publish', 'subscribe', 'dds', 'rclcpp', 'pub/sub', 'topic'],
  star: ['situation', 'task', 'action', 'result', 'impact', 'outcome', 'metrics'],
};

function getSynonyms(word: string): string[] {
  const w = word.toLowerCase();
  for (const [key, cluster] of Object.entries(SYNONYM_CLUSTERS)) {
    if (key === w || cluster.includes(w)) {
      return cluster;
    }
  }
  return [w];
}

function matchesWordFlexibly(targetWord: string, candidateWords: string[]): boolean {
  const targetLower = targetWord.toLowerCase();
  const targetStem = simpleStem(targetLower);
  const synonyms = getSynonyms(targetLower);

  for (const cand of candidateWords) {
    const candLower = cand.toLowerCase();
    const candStem = simpleStem(candLower);

    // Exact or stem match
    if (candLower === targetLower || candStem === targetStem) return true;

    // Common root prefix match (e.g. "communicat" in communicate / communication)
    if (candLower.length >= 6 && targetLower.length >= 6) {
      if (candLower.slice(0, 6) === targetLower.slice(0, 6)) return true;
    }

    // Synonym cluster match
    if (synonyms.includes(candLower) || synonyms.some(s => s === candStem)) return true;
  }

  return false;
}

export function matchConceptsAndAntiPatterns(
  candidateText: string,
  targetKeyConcepts: string[],
  antiPatterns: string[] = []
): ConceptMatchResult {
  if (!candidateText || candidateText.trim().length === 0) {
    return {
      identifiedConcepts: [],
      missingConcepts: [...targetKeyConcepts],
      conceptCoverageScore: 0,
      antiPatternsDetected: [],
      technicalKeywordDensity: 0,
    };
  }

  const lowerCandidate = candidateText.toLowerCase();
  const tokens = cleanAndTokenize(candidateText, false);

  const identified: string[] = [];
  const missing: string[] = [];

  for (const concept of targetKeyConcepts) {
    const lowerConcept = concept.toLowerCase();
    
    // Direct substring or exact multi-word match
    if (lowerCandidate.includes(lowerConcept)) {
      identified.push(concept);
      continue;
    }

    // Flexible multi-word token overlap with synonyms and morphological roots
    const conceptTokens = cleanAndTokenize(lowerConcept, true);
    if (conceptTokens.length > 0) {
      const matchCount = conceptTokens.filter(ct => matchesWordFlexibly(ct, tokens)).length;
      if (matchCount / conceptTokens.length >= 0.5) {
        identified.push(concept);
        continue;
      }
    }

    missing.push(concept);
  }

  // Anti-patterns detection
  const detectedAntiPatterns: string[] = [];
  for (const anti of antiPatterns) {
    if (lowerCandidate.includes(anti.toLowerCase())) {
      detectedAntiPatterns.push(anti);
    }
  }

  const coverageRatio = targetKeyConcepts.length > 0 
    ? (identified.length / targetKeyConcepts.length)
    : 1.0;

  // Concept coverage score (0-100)
  const conceptCoverageScore = Math.min(100, Math.round(coverageRatio * 100));

  // Technical keyword density: unique concepts & terms per 100 words
  const wordCount = tokens.length;
  const technicalKeywordDensity = wordCount > 0 
    ? Math.min(100, Math.round((identified.length * 100) / Math.max(15, wordCount / 4)))
    : 0;

  return {
    identifiedConcepts: identified,
    missingConcepts: missing,
    conceptCoverageScore,
    antiPatternsDetected: detectedAntiPatterns,
    technicalKeywordDensity,
  };
}
