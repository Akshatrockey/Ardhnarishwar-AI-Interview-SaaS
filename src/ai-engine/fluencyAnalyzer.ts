// Speech Fluency, Pacing, Filler-Word, and Linguistic Coherence Analyzer for Ardhnarishwar Core-AI

export interface FluencyMetrics {
  wordCount: number;
  wpm: number;
  fillerWordCount: number;
  fillerWordsFound: string[];
  fillerWordRatio: number; // percentage of speech that is filler
  pacingScore: number;     // 0-100 (optimal 120-160 WPM)
  clarityScore: number;    // 0-100 based on sentence structure
  hesitationRatio: number; // 0-1
  readabilityGrade: number;// Flesch-Kincaid approximate grade level
}

const COMMON_FILLER_PHRASES = [
  'you know',
  'i mean',
  'sort of',
  'kind of',
  'as such',
  'at the end of the day',
  'to be honest',
  'basically',
  'actually',
  'literally',
  'like',
  'um',
  'uh',
  'er',
  'ah'
];

export function analyzeFluencyAndPacing(
  transcript: string,
  durationSec: number = 60
): FluencyMetrics {
  if (!transcript || transcript.trim().length === 0) {
    return {
      wordCount: 0,
      wpm: 0,
      fillerWordCount: 0,
      fillerWordsFound: [],
      fillerWordRatio: 0,
      pacingScore: 0,
      clarityScore: 0,
      hesitationRatio: 0,
      readabilityGrade: 0,
    };
  }

  const cleanText = transcript.trim();
  const lowerText = cleanText.toLowerCase();
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Duration in minutes (at least 5 seconds to prevent divide by zero)
  const safeDurationSec = Math.max(5, durationSec);
  const durationMin = safeDurationSec / 60;
  const wpm = Math.round(wordCount / durationMin);

  // Filler words and phrases identification
  let fillerWordCount = 0;
  const fillersFound: string[] = [];

  for (const phrase of COMMON_FILLER_PHRASES) {
    // Regex with word boundaries
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches && matches.length > 0) {
      fillerWordCount += matches.length;
      fillersFound.push(`${phrase} (×${matches.length})`);
    }
  }

  const fillerWordRatio = wordCount > 0 ? (fillerWordCount / wordCount) * 100 : 0;

  // Pacing Score: Ideal conversational tech interview speed is 120-160 WPM
  let pacingScore = 100;
  if (wpm < 80) {
    pacingScore = Math.max(30, Math.round(wpm * 0.75));
  } else if (wpm < 110) {
    pacingScore = 80 + Math.round((wpm - 80) * 0.5);
  } else if (wpm <= 165) {
    pacingScore = 95 + Math.min(5, Math.round((165 - wpm) * 0.1));
  } else if (wpm <= 200) {
    pacingScore = 85 - Math.round((wpm - 165) * 0.5);
  } else {
    pacingScore = Math.max(40, 70 - Math.round((wpm - 200) * 0.3));
  }

  // Sentence structure and readability analysis
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const avgSentenceLength = wordCount / sentenceCount;

  // Syllables estimation
  let syllableCount = 0;
  for (const word of words) {
    syllableCount += countSyllables(word);
  }
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 1;

  // Flesch-Kincaid Grade Level formula
  const readabilityGrade = Math.max(
    1,
    Math.min(18, Math.round(0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59))
  );

  // Clarity Score based on filler ratio and sentence length balance
  let clarityPenalty = Math.min(45, fillerWordRatio * 3.5);
  if (avgSentenceLength > 35) clarityPenalty += 15; // Run-on sentences
  if (avgSentenceLength < 4) clarityPenalty += 10;  // Fragmented speech

  const clarityScore = Math.max(20, Math.min(100, Math.round(100 - clarityPenalty)));

  // Hesitation ratio
  const hesitationRatio = Math.min(1.0, fillerWordCount / Math.max(10, wordCount / 4));

  return {
    wordCount,
    wpm,
    fillerWordCount,
    fillerWordsFound: fillersFound,
    fillerWordRatio: Math.round(fillerWordRatio * 10) / 10,
    pacingScore,
    clarityScore,
    hesitationRatio: Math.round(hesitationRatio * 100) / 100,
    readabilityGrade,
  };
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const matches = w.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;
  if (w.endsWith('e') && !w.endsWith('le')) count--;
  return Math.max(1, count);
}
