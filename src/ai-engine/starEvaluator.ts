// STAR Methodology Evaluator (Situation, Task, Action, Result) for Behavioral & HR Questions

export interface STARAnalysis {
  situationClarity: number; // 0-100
  taskRelevance: number;    // 0-100
  actionExecution: number;  // 0-100
  resultImpact: number;     // 0-100
  overallStarScore: number; // 0-100
  actionVerbDensity: number;
  quantifiableMetricsDetected: string[];
  ownershipScore: number;   // First-person action ("I developed", "I decided") vs passive
}

const SITUATION_TRIGGERS = [
  'when i was', 'at my previous', 'project where', 'situation arose', 'faced a challenge',
  'our team had', 'the client needed', 'in my role as', 'we were building', 'there was a problem'
];

const TASK_TRIGGERS = [
  'my responsibility was', 'i needed to', 'tasked with', 'goal was to', 'objective was',
  'needed to ensure', 'had to deliver', 'had to fix', 'my role was to', 'assignment was'
];

const ACTION_TRIGGERS = [
  'i implemented', 'i designed', 'i developed', 'i refactored', 'i proposed', 'i initiated',
  'i debugged', 'i researched', 'i architected', 'i configured', 'i led the effort', 'i automated',
  'i coordinated', 'i analyzed', 'i created', 'i integrated', 'i optimized'
];

const RESULT_TRIGGERS = [
  'as a result', 'which led to', 'reduced by', 'improved by', 'increased by', 'saved',
  'delivered ahead', 'successfully deployed', 'outcome was', 'in the end', 'ultimately',
  'decreased downtime', 'zero regressions', 'prevented failure'
];

const METRIC_PATTERNS = [
  /\b\d+%\b/g,                              // e.g. 40%, 99.9%
  /\b\d+\s*(?:ms|seconds|minutes|hours|days|weeks|months|years)\b/gi, // e.g. 50ms, 2 weeks
  /\b\$\s*\d+(?:,\d+)*(?:\.\d+)?(?:k|m|b)?\b/gi, // e.g. $50k, $10,000
  /\b\d+\s*(?:times|x|fold|x faster)\b/gi,  // e.g. 10x, 3 times
  /\b\d+\s*(?:engineers|users|requests|nodes|robots|actuators|sensors)\b/gi // e.g. 500 users, 12 robots
];

export function evaluateSTARStructure(transcript: string): STARAnalysis {
  if (!transcript || transcript.trim().length === 0) {
    return {
      situationClarity: 0,
      taskRelevance: 0,
      actionExecution: 0,
      resultImpact: 0,
      overallStarScore: 0,
      actionVerbDensity: 0,
      quantifiableMetricsDetected: [],
      ownershipScore: 0,
    };
  }

  const lower = transcript.toLowerCase();

  // 1. Situation Score
  let sitMatches = 0;
  for (const trig of SITUATION_TRIGGERS) {
    if (lower.includes(trig)) sitMatches++;
  }
  const situationClarity = Math.min(100, Math.max(40, sitMatches * 35 + (lower.length > 60 ? 35 : 15)));

  // 2. Task Score
  let taskMatches = 0;
  for (const trig of TASK_TRIGGERS) {
    if (lower.includes(trig)) taskMatches++;
  }
  const taskRelevance = Math.min(100, Math.max(40, taskMatches * 35 + (lower.length > 60 ? 35 : 15)));

  // 3. Action Score
  let actionMatches = 0;
  for (const trig of ACTION_TRIGGERS) {
    if (lower.includes(trig)) actionMatches++;
  }
  const actionExecution = Math.min(100, Math.max(45, actionMatches * 30 + 35));

  // 4. Result Score & Quantifiable Metrics
  const foundMetrics: string[] = [];
  for (const pattern of METRIC_PATTERNS) {
    const matches = transcript.match(pattern);
    if (matches) {
      foundMetrics.push(...matches);
    }
  }

  let resultMatches = 0;
  for (const trig of RESULT_TRIGGERS) {
    if (lower.includes(trig)) resultMatches++;
  }
  const resultImpact = Math.min(
    100,
    Math.max(40, resultMatches * 30 + foundMetrics.length * 25 + (lower.length > 60 ? 25 : 0))
  );

  // Ownership Score: Count "I" vs "We"
  const iMatches = (lower.match(/\bi\b|\bmy\b|\bmine\b/g) || []).length;
  const weMatches = (lower.match(/\bwe\b|\bour\b|\bus\b/g) || []).length;
  const totalPronouns = iMatches + weMatches;
  const ownershipScore = totalPronouns > 0
    ? Math.min(100, Math.round((iMatches / totalPronouns) * 100))
    : 50;

  // Action verb density
  const words = transcript.split(/\s+/).length;
  const actionVerbDensity = Math.min(100, Math.round((actionMatches * 100) / Math.max(10, words / 10)));

  const overallStarScore = Math.round(
    situationClarity * 0.2 +
    taskRelevance * 0.2 +
    actionExecution * 0.35 +
    resultImpact * 0.25
  );

  return {
    situationClarity,
    taskRelevance,
    actionExecution,
    resultImpact,
    overallStarScore,
    actionVerbDensity,
    quantifiableMetricsDetected: Array.from(new Set(foundMetrics)),
    ownershipScore,
  };
}
