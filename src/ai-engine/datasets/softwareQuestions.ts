import { Question } from '../../types';

export const SOFTWARE_QUESTION_DATASET: Question[] = [
  {
    id: 'q_sw_01',
    category: 'TECHNICAL',
    roleCategory: 'Distributed Systems / Cloud Architect',
    questionType: 'TECHNICAL',
    difficulty: 'HARD',
    title: 'Distributed Consensus & Raft vs Paxos',
    prompt: 'Compare Raft and Paxos consensus algorithms. How does Raft handle leader election, log replication, and split-brain scenarios in a distributed cluster?',
    expectedDurationSec: 110,
    expectedAnswer: 'Raft decomposes distributed consensus into three distinct sub-problems: Leader Election, Log Replication, and Safety. Unlike Paxos which is symmetric and difficult to comprehend, Raft is asymmetric and leader-driven. In Raft, a node starts as Follower, transitions to Candidate upon election timeout with randomized timers, and requests votes. A candidate needs a majority quorum (N/2 + 1) to become Leader. Log replication happens via AppendEntries RPCs; an entry is committed once replicated across a majority. Split-brain is prevented because only one partition can achieve a majority quorum to elect a leader or commit entries. When the network partition heals, the term number and log index enforce reconciliation, overriding uncommitted conflicting logs from minority partitions.',
    idealBenchmarkAnswer: 'Raft decomposes distributed consensus into three distinct sub-problems: Leader Election, Log Replication, and Safety. Unlike Paxos which is symmetric and difficult to comprehend, Raft is asymmetric and leader-driven. In Raft, a node starts as Follower, transitions to Candidate upon election timeout with randomized timers, and requests votes. A candidate needs a majority quorum (N/2 + 1) to become Leader. Log replication happens via AppendEntries RPCs; an entry is committed once replicated across a majority. Split-brain is prevented because only one partition can achieve a majority quorum to elect a leader or commit entries. When the network partition heals, the term number and log index enforce reconciliation, overriding uncommitted conflicting logs from minority partitions.',
    evaluationCriteria: [
      'Contrasts Raft (leader-driven, understandable sub-problems) vs Paxos (symmetric, multi-round complex)',
      'Explains Raft leader election (randomized election timeouts, majority quorum N/2 + 1)',
      'Explains log replication (AppendEntries RPCs) and split-brain resolution via terms and majority quorum'
    ],
    keyConcepts: [
      'Raft consensus',
      'Leader election',
      'Log replication',
      'Quorum majority',
      'Split-brain prevention',
      'AppendEntries RPC',
      'Term numbers',
      'Paxos comparison'
    ],
    antiPatterns: [
      'allowing multiple leaders to commit concurrently',
      'ignoring quorum requirements'
    ],
    maxScore: 10,
    rubric: {
      relevanceWeight: 0.25,
      technicalWeight: 0.45,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.1,
      confidenceWeight: 0.05,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'q_sw_02',
    category: 'TECHNICAL',
    roleCategory: 'Full Stack & Platform Engineer',
    questionType: 'SYSTEM_DESIGN',
    difficulty: 'MEDIUM',
    title: 'Multi-Tenant Data Isolation & Security Architecture',
    prompt: 'How do you design a secure multi-tenant SaaS architecture? Discuss database schema partitioning strategies, JWT tenant claim propagation, and prevention of cross-tenant data leaks.',
    expectedDurationSec: 100,
    expectedAnswer: 'Multi-tenant architecture can be implemented using three patterns: Shared Database with Shared Schema (Discriminator Column), Shared Database with Separate Schemas, or Database-per-tenant. For high-scale SaaS with cost efficiency, Shared Database with a discriminator column (companyId / tenant_id) is ideal, augmented with PostgreSQL Row Level Security (RLS) policies to enforce isolation at the database engine level. On the backend, authenticated JWT tokens embed the tenant ID as a signed claim. Middleware extracts the tenant ID, sets request-scoped execution context, and automatically injects companyId into all queries and audit logs. Cross-tenant leakage is prevented via automated regression tests, strict object-level access control, and tenant-scoped caching keys.',
    idealBenchmarkAnswer: 'Multi-tenant architecture can be implemented using three patterns: Shared Database with Shared Schema (Discriminator Column), Shared Database with Separate Schemas, or Database-per-tenant. For high-scale SaaS with cost efficiency, Shared Database with a discriminator column (companyId / tenant_id) is ideal, augmented with PostgreSQL Row Level Security (RLS) policies to enforce isolation at the database engine level. On the backend, authenticated JWT tokens embed the tenant ID as a signed claim. Middleware extracts the tenant ID, sets request-scoped execution context, and automatically injects companyId into all queries and audit logs. Cross-tenant leakage is prevented via automated regression tests, strict object-level access control, and tenant-scoped caching keys.',
    evaluationCriteria: [
      'Identifies multi-tenant storage patterns (discriminator column vs separate schema vs separate DB)',
      'Explains database isolation enforcement (e.g. Row-Level Security RLS)',
      'Explains secure tenant propagation via authenticated JWT claims and request middleware'
    ],
    keyConcepts: [
      'Multi-tenant architecture',
      'Row Level Security',
      'Discriminator column',
      'JWT tenant claim',
      'Request context',
      'Data isolation',
      'Tenant-scoped cache',
      'Cross-tenant leakage prevention'
    ],
    antiPatterns: [
      'trusting client-provided companyId without JWT verification',
      'shared caching without tenant namespaces'
    ],
    maxScore: 10,
    rubric: {
      relevanceWeight: 0.25,
      technicalWeight: 0.4,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.15,
      confidenceWeight: 0.05,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    id: 'q_sw_03',
    category: 'PROBLEM_SOLVING',
    roleCategory: 'Backend / Systems Engineer',
    questionType: 'SYSTEM_DESIGN',
    difficulty: 'MEDIUM',
    title: 'High-Throughput WebSocket Telemetry Pipeline',
    prompt: 'Design a telemetry ingestion backend capable of handling 50,000 connected autonomous mobile robots sending 100Hz IMU/pose updates. How do you prevent thread starvation and backpressure?',
    expectedDurationSec: 120,
    expectedAnswer: 'To handle 50,000 robots at 100Hz (5 million events/sec), we design an asynchronous event-driven ingestion pipeline. The edge termination layer uses high-performance WebSocket gateways (e.g. Netty or Go with epoll/kqueue event loops) with connection pooling. Protobuf or FlatBuffers binary serialization minimizes payload size over JSON. For backpressure, reactive streams with leaky-bucket rate limiting drop low-priority debug packets under congestion while buffering critical state alerts. The gateway pushes telemetry directly into distributed partitioned message brokers like Apache Kafka with partition keys mapped to robot fleet IDs. Downstream stream processors (Apache Flink) aggregate time-series windows and write to TimescaleDB or ClickHouse for low-latency querying.',
    idealBenchmarkAnswer: 'To handle 50,000 robots at 100Hz (5 million events/sec), we design an asynchronous event-driven ingestion pipeline. The edge termination layer uses high-performance WebSocket gateways (e.g. Netty or Go with epoll/kqueue event loops) with connection pooling. Protobuf or FlatBuffers binary serialization minimizes payload size over JSON. For backpressure, reactive streams with leaky-bucket rate limiting drop low-priority debug packets under congestion while buffering critical state alerts. The gateway pushes telemetry directly into distributed partitioned message brokers like Apache Kafka with partition keys mapped to robot fleet IDs. Downstream stream processors (Apache Flink) aggregate time-series windows and write to TimescaleDB or ClickHouse for low-latency querying.',
    evaluationCriteria: [
      'Architects asynchronous non-blocking event loops (epoll/kqueue/Netty) for high concurrency',
      'Designs backpressure and binary serialization (Protobuf/FlatBuffers) strategies',
      'Integrates distributed partitioned message brokers (Kafka) and time-series aggregation'
    ],
    keyConcepts: [
      'WebSocket gateway',
      'Event loop epoll',
      'Protobuf serialization',
      'Backpressure management',
      'Apache Kafka partitioning',
      'Time-series aggregation',
      'High throughput',
      'Connection pooling'
    ],
    antiPatterns: [
      'using synchronous thread-per-connection architectures',
      'writing directly to relational database without message broker buffer'
    ],
    maxScore: 10,
    rubric: {
      relevanceWeight: 0.2,
      technicalWeight: 0.4,
      communicationWeight: 0.15,
      problemSolvingWeight: 0.2,
      confidenceWeight: 0.05,
    },
    isGlobal: true,
    createdAt: '2026-01-15T08:00:00.000Z'
  }
];
