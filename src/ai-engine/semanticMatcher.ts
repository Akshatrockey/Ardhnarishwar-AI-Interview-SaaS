// Concept Graph & Domain Terminology Density Matching for Ardhnarishwar Core-AI
import { cleanAndTokenize, simpleStem } from './tokenizer';

export interface ConceptMatchResult {
  identifiedConcepts: string[];
  missingConcepts: string[];
  conceptCoverageScore: number; // 0-100
  antiPatternsDetected: string[];
  technicalKeywordDensity: number;
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
  const stemmedCandidateWords = new Set(tokens.map(t => simpleStem(t)));

  const identified: string[] = [];
  const missing: string[] = [];

  for (const concept of targetKeyConcepts) {
    const lowerConcept = concept.toLowerCase();
    
    // Direct substring or exact multi-word match
    if (lowerCandidate.includes(lowerConcept)) {
      identified.push(concept);
      continue;
    }

    // Stemmed token overlap for compound concepts
    const conceptTokens = cleanAndTokenize(lowerConcept, true);
    if (conceptTokens.length > 0) {
      const matchCount = conceptTokens.filter(ct => stemmedCandidateWords.has(simpleStem(ct))).length;
      if (matchCount / conceptTokens.length >= 0.75) {
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

  // Concept coverage score (0-100) with slight curve
  const conceptCoverageScore = Math.min(100, Math.round(coverageRatio * 100));

  // Technical keyword density: unique concepts & terms per 100 words
  const wordCount = tokens.length;
  const technicalKeywordDensity = wordCount > 0 
    ? Math.min(100, Math.round((identified.length * 100) / Math.max(20, wordCount / 5)))
    : 0;

  return {
    identifiedConcepts: identified,
    missingConcepts: missing,
    conceptCoverageScore,
    antiPatternsDetected: detectedAntiPatterns,
    technicalKeywordDensity,
  };
}
