import { Question } from '../../types';

export const HR_BEHAVIORAL_QUESTION_DATASET: Question[] = [
  {
    id: 'q_hr_01',
    category: 'BEHAVIORAL',
    roleCategory: 'Engineering Leadership / General',
    questionType: 'BEHAVIORAL',
    difficulty: 'MEDIUM',
    title: 'Resolving Technical Disagreements in High-Stakes Deadlines',
    prompt: 'Tell me about a time when you and another senior engineer had a strong disagreement regarding system architecture or technology stack choices right before a critical project deadline. How did you resolve it?',
    expectedDurationSec: 110,
    expectedAnswer: 'At my previous robotics company, we had a major disagreement on whether to adopt ROS2 Zenoh or Fast-DDS for our multi-robot swarm deployment two weeks before field trials. I scheduled a focused 45-minute spike session with the engineer. Rather than arguing theoretical merits, I proposed establishing objective, measurable criteria: latency under packet loss, memory footprint on Jetson boards, and ease of debugging. I built a quick benchmark testbed measuring latency over simulated lossy Wi-Fi. The empirical data clearly demonstrated Zenoh reduced CPU overhead by 35% with lower jitter. We documented the decision in an Architecture Decision Record (ADR), aligned the team, and deployed on time without interpersonal friction.',
    idealBenchmarkAnswer: 'At my previous robotics company, we had a major disagreement on whether to adopt ROS2 Zenoh or Fast-DDS for our multi-robot swarm deployment two weeks before field trials. I scheduled a focused 45-minute spike session with the engineer. Rather than arguing theoretical merits, I proposed establishing objective, measurable criteria: latency under packet loss, memory footprint on Jetson boards, and ease of debugging. I built a quick benchmark testbed measuring latency over simulated lossy Wi-Fi. The empirical data clearly demonstrated Zenoh reduced CPU overhead by 35% with lower jitter. We documented the decision in an Architecture Decision Record (ADR), aligned the team, and deployed on time without interpersonal friction.',
    evaluationCriteria: [
      'Follows STAR method (Situation, Task, Action, Result) with clear framing',
      'Demonstrates objective data-driven resolution (benchmarking, proof-of-concept, or Architecture Decision Record)',
      'Shows professional collaboration, active listening, and constructive consensus-building under pressure'
    ],
    keyConcepts: [
      'Objective evaluation criteria',
      'Empirical benchmarking',
      'Architecture Decision Record',
      'Collaborative alignment',
      'Time-boxed spike',
      'Quantifiable outcome',
      'Active listening'
    ],
    antiPatterns: [
      'appealing to authority without evidence',
      'escalating to management aggressively',
      'refusing to compromise'
    ],
    maxScore: 10,
    rubric: {
      relevanceWeight: 0.2,
      technicalWeight: 0.2,
      communicationWeight: 0.25,
      problemSolvingWeight: 0.25,
      confidenceWeight: 0.1,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'q_hr_02',
    category: 'BEHAVIORAL',
    roleCategory: 'Engineering Leadership / General',
    questionType: 'BEHAVIORAL',
    difficulty: 'HARD',
    title: 'Managing Production Outage & Blameless Post-Mortem',
    prompt: 'Describe an incident where a critical bug or hardware regression made it to production or a live client demo. How did you lead the mitigation, communicate with stakeholders, and prevent recurrence?',
    expectedDurationSec: 120,
    expectedAnswer: 'During a live autonomous warehouse pilot, a corner-case race condition in our LiDAR obstacle avoidance node caused a mobile AGV to trigger emergency safety stop falsely, stalling material transport for 25 minutes. I immediately initiated incident response, rolled back to the previous verified stable firmware release within 8 minutes, and restored warehouse operations. I then drafted a transparent status update for operations leadership detailing impact and timeline. Over the next 48 hours, I conducted a blameless post-mortem with the perception team. We identified that the regression slipped through because our simulation CI suite lacked dynamic reflection edge-cases. We implemented hardware-in-the-loop (HIL) automated regression tests and added safety watchdog alerts, resulting in zero false-positive safety stops for the subsequent 9 months.',
    idealBenchmarkAnswer: 'During a live autonomous warehouse pilot, a corner-case race condition in our LiDAR obstacle avoidance node caused a mobile AGV to trigger emergency safety stop falsely, stalling material transport for 25 minutes. I immediately initiated incident response, rolled back to the previous verified stable firmware release within 8 minutes, and restored warehouse operations. I then drafted a transparent status update for operations leadership detailing impact and timeline. Over the next 48 hours, I conducted a blameless post-mortem with the perception team. We identified that the regression slipped through because our simulation CI suite lacked dynamic reflection edge-cases. We implemented hardware-in-the-loop (HIL) automated regression tests and added safety watchdog alerts, resulting in zero false-positive safety stops for the subsequent 9 months.',
    evaluationCriteria: [
      'Structured incident triage (immediate rollback/mitigation within clear SLA)',
      'Transparent, timely stakeholder communication',
      'Conducts blameless post-mortem and implements systemic preventive safeguards (HIL CI tests, automated watchdogs)'
    ],
    keyConcepts: [
      'Incident response',
      'Rapid rollback',
      'Stakeholder communication',
      'Blameless post-mortem',
      'Hardware-in-the-loop testing',
      'Root cause analysis',
      'Preventive regression suite'
    ],
    antiPatterns: [
      'blaming junior engineers',
      'hiding the outage from leadership',
      'not adding automated tests to prevent recurrence'
    ],
    maxScore: 10,
    rubric: {
      relevanceWeight: 0.2,
      technicalWeight: 0.25,
      communicationWeight: 0.25,
      problemSolvingWeight: 0.2,
      confidenceWeight: 0.1,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'q_hr_03',
    category: 'HR',
    roleCategory: 'General / Cultural Fit',
    questionType: 'HR',
    difficulty: 'EASY',
    title: 'Motivation & Career Goals in AI & Robotics',
    prompt: 'Why are you passionate about working at the intersection of AI and physical robotics systems? Where do you see your technical impact over the next 3 to 5 years?',
    expectedDurationSec: 90,
    expectedAnswer: 'I am fascinated by robotics because it bridges the gap between pure digital AI abstractions and the messy, uncertain physical world. In the physical realm, algorithms have real-world physical consequences: kinematic limits, inertia, sensor noise, and safety constraints. Over the next 3 to 5 years, my goal is to lead the integration of foundation models and multimodal vision-language-action (VLA) architectures into real-time industrial robotics, enabling robots to generalize tasks without requiring weeks of custom trajectory programming. I want to contribute to high-reliability platforms that scale safely in human-collaborative environments.',
    idealBenchmarkAnswer: 'I am fascinated by robotics because it bridges the gap between pure digital AI abstractions and the messy, uncertain physical world. In the physical realm, algorithms have real-world physical consequences: kinematic limits, inertia, sensor noise, and safety constraints. Over the next 3 to 5 years, my goal is to lead the integration of foundation models and multimodal vision-language-action (VLA) architectures into real-time industrial robotics, enabling robots to generalize tasks without requiring weeks of custom trajectory programming. I want to contribute to high-reliability platforms that scale safely in human-collaborative environments.',
    evaluationCriteria: [
      'Articulates genuine understanding of physical embodied AI challenges (hardware limits, safety, uncertainty)',
      'Clear, ambitious 3-5 year technical roadmap (e.g. foundation models, VLA, autonomy scalability)',
      'Demonstrates passion for real-world impact and high-reliability systems'
    ],
    keyConcepts: [
      'Physical world intersection',
      'Safety and physical constraints',
      'Vision-language-action models',
      'Industrial robotics scalability',
      'Technical leadership',
      'Continuous learning'
    ],
    antiPatterns: [
      'generic answers like "I just want a high salary"',
      'showing no genuine interest in physical robotics hardware'
    ],
    maxScore: 10,
    rubric: {
      relevanceWeight: 0.25,
      technicalWeight: 0.2,
      communicationWeight: 0.3,
      problemSolvingWeight: 0.15,
      confidenceWeight: 0.1,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  }
];
