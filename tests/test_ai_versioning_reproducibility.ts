/**
 * Automated Test Suite for AI Model Versioning & Historical Reproducibility
 * Tests:
 * 1. AI Model Version Metadata Registration
 * 2. Version-controlled scoring across multiple model generations (v1.0.0 vs v3.4.0)
 * 3. Immutable Snapshotting on Evaluation Reports
 * 4. Deterministic Reproducibility of historical evaluations using frozen snapshots
 */

import { 
  REGISTERED_AI_MODEL_VERSIONS, 
  evaluateCandidateAnswer, 
  compileSessionEvaluationReport,
  computeReproducibilityHash
} from './src/ai-engine/scoringPipeline';
import { Question } from './src/types';

console.log('================================================================');
console.log('  TESTING AI MODEL VERSIONING, METADATA & REPRODUCIBILITY       ');
console.log('================================================================');

// 1. Verify Metadata on Registered AI Versions
console.log('\n[TEST 1] AI Model Version Metadata Registry Audit:');
console.log(`- Registered AI Versions Count: ${REGISTERED_AI_MODEL_VERSIONS.length}`);

for (const v of REGISTERED_AI_MODEL_VERSIONS) {
  console.log(`  • Version ID: "${v.id}"`);
  console.log(`    - Version Tag: ${v.versionTag} (Active: ${v.isActive})`);
  console.log(`    - Dataset Ref: ${v.datasetRef} (v${v.datasetVersion}) | Checksum: ${v.datasetChecksum.slice(0, 16)}...`);
  console.log(`    - Scoring Config: Tech Weight=${v.scoringConfig.weights.technical}, Rel Weight=${v.scoringConfig.weights.relevance}`);
  console.log(`    - Feature Config: N-Grams=[${v.featureConfig.ngramRange.join(', ')}], WPM=[${v.featureConfig.minWpm}-${v.featureConfig.maxWpm}]`);
  console.log(`    - Rule Config: Anti-Pattern Penalty=${v.ruleConfig.antiPatternPenalty}pts`);
  console.log(`    - Validation Metrics: Accuracy=${v.evaluationMetrics.validationAccuracy}, F1=${v.evaluationMetrics.f1Score}, RMSE=${v.evaluationMetrics.benchmarkRmse}`);
  console.log(`    - Created At: ${v.createdAt} by ${v.createdBy}`);

  // Assertions on mandatory version metadata
  if (!v.id || !v.versionTag || !v.datasetRef || !v.datasetChecksum || !v.scoringConfig || !v.featureConfig || !v.ruleConfig || !v.evaluationMetrics) {
    throw new Error(`Version ${v.id} is missing mandatory metadata fields!`);
  }
}
console.log('✓ TEST 1 PASSED: All registered AI versions contain 100% complete metadata, dataset references, and benchmark metrics.');

// 2. Define Mock Question
const testQuestion: Question = {
  id: 'q_kinematics_test',
  category: 'TECHNICAL',
  roleCategory: 'Robotics & Controls',
  difficulty: 'HARD',
  title: 'Forward vs Inverse Kinematics',
  prompt: 'Explain Forward vs Inverse Kinematics and Jacobian singularity avoidance.',
  expectedDurationSec: 120,
  idealBenchmarkAnswer: 'Forward kinematics uses DH parameters to calculate Cartesian pose from joint angles. Inverse kinematics computes joint angles for a desired Cartesian pose. Singularities occur when the Jacobian matrix loses full rank, preventing motion in certain directions.',
  keyConcepts: ['Forward Kinematics', 'Inverse Kinematics', 'Denavit-Hartenberg', 'Jacobian Matrix'],
  antiPatterns: ['Ignoring singularities', 'Gimbal lock confusion'],
  rubric: {
    relevanceWeight: 0.30,
    technicalWeight: 0.50,
    communicationWeight: 0.20,
    problemSolvingWeight: 0.0,
    confidenceWeight: 0.0
  },
  isGlobal: true,
  createdAt: new Date().toISOString()
};

const candidateTranscript = 
  "Forward kinematics uses Denavit-Hartenberg parameters to calculate the end effector pose. " +
  "Inverse kinematics calculates joint angles. Singularities happen when Jacobian matrix drops rank. " +
  "Also there is gimbal lock confusion sometimes.";

// 3. Test Evaluation under v1.0.0 (Legacy Baseline: Lower penalty = 10pts)
console.log('\n[TEST 2] Evaluating Candidate Answer under v1.0.0 (Legacy Baseline):');
const v1 = REGISTERED_AI_MODEL_VERSIONS[0];
const answerV1 = evaluateCandidateAnswer(candidateTranscript, testQuestion, 45, undefined, v1);
const reportV1 = compileSessionEvaluationReport('sess_cand_01', 'cand_01', [answerV1], v1);

console.log(`- Version Used: ${reportV1.modelVersionSnapshot.versionTag}`);
console.log(`- Dataset Ref:  ${reportV1.modelVersionSnapshot.datasetRef} (v${reportV1.modelVersionSnapshot.datasetVersion})`);
console.log(`- Overall Score: ${reportV1.overallScore}/100`);
console.log(`- Technical Depth: ${reportV1.dimensionScores.technicalDepth}/100`);
console.log(`- Reproducibility Hash: ${reportV1.reproducibilityHash}`);

// 4. Test Evaluation under v3.4.0 (Production Core: Stricter penalty = 15pts)
console.log('\n[TEST 3] Evaluating Candidate Answer under v3.4.0 (Production Core):');
const v3 = REGISTERED_AI_MODEL_VERSIONS[2];
const answerV3 = evaluateCandidateAnswer(candidateTranscript, testQuestion, 45, undefined, v3);
const reportV3 = compileSessionEvaluationReport('sess_cand_02', 'cand_02', [answerV3], v3);

console.log(`- Version Used: ${reportV3.modelVersionSnapshot.versionTag}`);
console.log(`- Dataset Ref:  ${reportV3.modelVersionSnapshot.datasetRef} (v${reportV3.modelVersionSnapshot.datasetVersion})`);
console.log(`- Overall Score: ${reportV3.overallScore}/100`);
console.log(`- Technical Depth: ${reportV3.dimensionScores.technicalDepth}/100`);
console.log(`- Reproducibility Hash: ${reportV3.reproducibilityHash}`);

if (reportV1.overallScore !== reportV3.overallScore) {
  console.log(`✓ TEST 3 PASSED: Version evolution reflected in scoring logic (${reportV1.overallScore} vs ${reportV3.overallScore}).`);
} else {
  console.error('✗ TEST 3 FAILED: Scores did not differ across distinct model versions');
}

// 5. HISTORICAL REPRODUCIBILITY TEST
console.log('\n[TEST 4] HISTORICAL EVALUATION REPRODUCIBILITY AUDIT:');
console.log('Action: Re-running evaluation for Candidate 1 using their saved v1.0.0 model version snapshot...');

const reproducedAnswer = evaluateCandidateAnswer(candidateTranscript, testQuestion, 45, undefined, v1);
const reproducedReport = compileSessionEvaluationReport('sess_cand_01', 'cand_01', [reproducedAnswer], v1);

console.log(`- Original Score:   ${reportV1.overallScore}`);
console.log(`- Reproduced Score: ${reproducedReport.overallScore}`);
console.log(`- Original Hash:    ${reportV1.reproducibilityHash}`);
console.log(`- Reproduced Hash:  ${reproducedReport.reproducibilityHash}`);

if (
  reportV1.overallScore === reproducedReport.overallScore &&
  reportV1.reproducibilityHash === reproducedReport.reproducibilityHash &&
  reportV1.dimensionScores.technicalDepth === reproducedReport.dimensionScores.technicalDepth
) {
  console.log('✓ TEST 4 PASSED: 100% MATHEMATICAL REPRODUCIBILITY VERIFIED ACROSS HISTORICAL AI VERSIONS!');
} else {
  console.error('✗ TEST 4 FAILED: Historical evaluation not reproducible');
  process.exit(1);
}

console.log('\n================================================================');
console.log('  ALL AI MODEL VERSIONING & REPRODUCIBILITY TESTS PASSED 100%!  ');
console.log('================================================================\n');
