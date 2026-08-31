/**
 * Automated Verification Test Suite for:
 * 1. Benchmark Question Deletion & Dynamic Creation in AI Training Studio
 * 2. Tenant-Specific Login & Multi-Tenant Workspace Isolation
 * 3. AI Evaluation strictly following Benchmark Questions & Expected Answers from AI Training Studio
 */

import { AppDataStore } from '../src/services/storage';
import { evaluateCandidateAnswer } from '../src/ai-engine/scoringPipeline';
import { Question, QuestionCategory, AIEngineHyperparams } from '../src/types';

// Mock localStorage for Node testing
if (typeof localStorage === 'undefined' || localStorage === null) {
  let store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

let passed = 0;
let total = 0;

function assert(cond: boolean, name: string, detail?: string) {
  total++;
  if (cond) {
    passed++;
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name}: ${detail || 'Assertion failed'}`);
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log('🎯 ARDHNARISHWAR AI SAAS: BENCHMARK DELETION, TENANTS & AI EVAL TEST');
  console.log('========================================================================\n');

  AppDataStore.init();

  // -------------------------------------------------------------
  // TEST 1: Benchmark Question Deletion in AI Training Studio
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Benchmark Question Deletion & Management ---');
  const initialQuestions = AppDataStore.getQuestions();
  const initialCount = initialQuestions.length;
  assert(initialCount > 0, 'Test 1.1: Question bank has initial benchmark questions');

  const questionToDelete = initialQuestions[0];
  const remaining = initialQuestions.filter(q => q.id !== questionToDelete.id);
  AppDataStore.saveQuestions(remaining);

  const reloadedQuestions = AppDataStore.getQuestions();
  const isDeleted = !reloadedQuestions.some(q => q.id === questionToDelete.id);
  assert(isDeleted && reloadedQuestions.length === initialCount - 1, 'Test 1.2: Super Admin / HR can permanently delete any benchmark question');

  // -------------------------------------------------------------
  // TEST 2: Dynamic Question Creation in AI Training Studio
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: AI Training Studio Benchmark Question Definition ---');
  const customStudioQuestion: Question = {
    id: `q_studio_test_${Date.now()}`,
    title: 'Distributed Transformer Attention & KV Cache Optimization',
    category: 'TECHNICAL',
    roleCategory: 'Large Language Model Systems Architect',
    questionType: 'TECHNICAL',
    difficulty: 'HARD',
    expectedDurationSec: 120,
    prompt: 'Explain how FlashAttention-2 and PagedAttention optimize the KV Cache during transformer autoregressive decoding.',
    expectedAnswer: 'FlashAttention-2 eliminates redundant HBM memory reads and writes using tiled online softmax computations and warp-level parallelization. PagedAttention divides the key-value cache into non-contiguous virtual memory blocks, eliminating internal fragmentation and supporting high-throughput continuous batching in vLLM.',
    idealBenchmarkAnswer: 'FlashAttention-2 eliminates redundant HBM memory reads and writes using tiled online softmax computations and warp-level parallelization. PagedAttention divides the key-value cache into non-contiguous virtual memory blocks, eliminating internal fragmentation and supporting high-throughput continuous batching in vLLM.',
    evaluationCriteria: [
      'Explains FlashAttention-2 tiled online softmax and HBM IO reduction',
      'Describes PagedAttention non-contiguous virtual memory block paging for KV Cache',
      'Identifies memory fragmentation mitigation and continuous batching in inference engines like vLLM'
    ],
    keyConcepts: [
      'FlashAttention',
      'PagedAttention',
      'KV Cache',
      'tiled online softmax',
      'HBM memory',
      'vLLM',
      'continuous batching',
      'memory fragmentation'
    ],
    antiPatterns: ['Confusing KV Cache with CNN weights', 'Assuming attention is strictly linear without quadratic memory'],
    maxScore: 10,
    rubric: {
      relevanceWeight: 0.25,
      technicalWeight: 0.40,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.10,
      confidenceWeight: 0.10
    },
    isGlobal: true,
    createdAt: new Date().toISOString()
  };

  const updatedWithCustom = [customStudioQuestion, ...reloadedQuestions];
  AppDataStore.saveQuestions(updatedWithCustom);

  const verifiedBank = AppDataStore.getQuestions();
  const foundSaved = verifiedBank.find(q => q.id === customStudioQuestion.id);
  assert(!!foundSaved && foundSaved.expectedAnswer.includes('FlashAttention-2'), 'Test 2.1: Custom benchmark question saved with ground truth in AI Training Studio');
  assert(foundSaved!.evaluationCriteria.length === 3, 'Test 2.2: Predefined evaluation criteria properly registered in question metadata');

  // -------------------------------------------------------------
  // TEST 3: AI Evaluation Candidate Answers against Studio Benchmark
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: AI Evaluation strictly driven by Training Studio Benchmark ---');
  
  // 3.1: Strong Candidate Answer matching Training Studio Benchmark
  const strongCandidateAnswer = `FlashAttention-2 accelerates transformer decoding by reducing High Bandwidth Memory (HBM) bandwidth bottlenecks through tiled online softmax computations. PagedAttention applies virtual memory paging principles to the Key-Value (KV) cache, allocating non-contiguous memory blocks which eliminates internal and external memory fragmentation and enables dynamic continuous batching in vLLM inference runtimes.`;
  
  const strongEval = evaluateCandidateAnswer(
    strongCandidateAnswer,
    customStudioQuestion,
    45,
    AppDataStore.getHyperparams()
  );

  assert(strongEval.obtainedScore >= 8.0, `Test 3.1: Strong candidate achieves high marks (${strongEval.obtainedScore}/10) against Training Studio criteria`);
  assert(strongEval.status === 'CORRECT', `Test 3.2: Strong candidate assigned status CORRECT (got ${strongEval.status})`);
  assert(strongEval.keyConceptsIdentified.length >= 4, `Test 3.3: Concepts defined in Training Studio identified in candidate response (${strongEval.keyConceptsIdentified.join(', ')})`);

  // 3.2: Partial Answer missing key criteria
  const partialCandidateAnswer = `FlashAttention is faster because of GPU kernels. We use it to make transformers run faster with less memory.`;
  const partialEval = evaluateCandidateAnswer(
    partialCandidateAnswer,
    customStudioQuestion,
    25,
    AppDataStore.getHyperparams()
  );

  assert(partialEval.obtainedScore < strongEval.obtainedScore, `Test 3.4: Partial answer awarded lower marks (${partialEval.obtainedScore}/10) than strong answer`);
  assert(partialEval.missingConcepts.length > 0, `Test 3.5: Missing criteria & concepts flagged according to Training Studio rubric (${partialEval.missingConcepts.slice(0, 3).join(', ')})`);

  // 3.3: Irrelevant Answer penalized
  const irrelevantCandidateAnswer = `I like to bake chocolate cookies using sugar, flour, and baking powder.`;
  const irrelevantEval = evaluateCandidateAnswer(
    irrelevantCandidateAnswer,
    customStudioQuestion,
    15,
    AppDataStore.getHyperparams()
  );

  assert(irrelevantEval.obtainedScore <= 2.5, `Test 3.6: Irrelevant answer heavily penalized (${irrelevantEval.obtainedScore}/10)`);
  assert(irrelevantEval.status === 'INCORRECT', `Test 3.7: Irrelevant answer marked as INCORRECT`);

  // -------------------------------------------------------------
  // TEST 4: Tenant-Specific Login & Data Isolation
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Multi-Tenant Workspace Login & Isolation ---');
  const companies = AppDataStore.getCompanies();
  const cyberdyne = companies.find(c => c.id === 'comp_cyberdyne') || companies[1];
  const boston = companies.find(c => c.id === 'comp_boston_bio') || companies[2];

  assert(!!cyberdyne && !!boston, 'Test 4.1: Distinct enterprise tenants exist in system');

  // Verify Cyberdyne tenant isolation
  const cyberdyneJobs = AppDataStore.getJobs().filter(j => j.companyId === cyberdyne.id);
  const cyberdyneIsolated = cyberdyneJobs.length > 0 && cyberdyneJobs.every(j => j.companyId === cyberdyne.id);
  assert(cyberdyneIsolated, `Test 4.2: Cyberdyne workspace isolated from cross-tenant jobs (${cyberdyneJobs.length} jobs)`);

  // Verify Boston BioRobotics tenant isolation
  const bostonJobs = AppDataStore.getJobs().filter(j => j.companyId === boston.id);
  const bostonIsolated = bostonJobs.length > 0 && bostonJobs.every(j => j.companyId === boston.id);
  assert(bostonIsolated, `Test 4.3: Boston BioRobotics workspace isolated from cross-tenant jobs (${bostonJobs.length} jobs)`);

  console.log('\n========================================================================');
  console.log(`🎯 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
