import { BenchmarkPrompt, ModelProfile, EvaluationRun, EvaluationDimension } from '../types/benchmark';
import { BENCHMARK_MODELS } from '../data/seedBenchmarks';

export interface EvaluationPayload {
  benchmarkId?: string;
  benchmarkTitle: string;
  category: string;
  customPrompt: string;
  modelAId: string;
  modelBId: string;
  weights?: Record<EvaluationDimension, number>;
  groundTruthCriteria?: string[];
  useWebSearch?: boolean;
  searchContext?: string;
}

export async function simulateClientEvaluation(payload: EvaluationPayload): Promise<EvaluationRun> {
  const modelA = BENCHMARK_MODELS.find(m => m.id === payload.modelAId) || BENCHMARK_MODELS[0];
  const modelB = BENCHMARK_MODELS.find(m => m.id === payload.modelBId) || BENCHMARK_MODELS[1];

  const latencyA = Math.floor(Math.random() * 400) + (modelA.thinkingLevel === 'HIGH' ? 850 : 350);
  const latencyB = Math.floor(Math.random() * 400) + (modelB.thinkingLevel === 'HIGH' ? 850 : 350);

  const tokensA = Math.floor(Math.random() * 200) + 300;
  const tokensB = Math.floor(Math.random() * 200) + 300;

  const dimScoresA: Record<EvaluationDimension, number> = {
    productReasoning: Number((7.8 + Math.random() * 1.8).toFixed(1)),
    technicalFeasibility: Number((8.0 + Math.random() * 1.8).toFixed(1)),
    completeness: Number((7.5 + Math.random() * 2.0).toFixed(1)),
    relevance: Number((8.2 + Math.random() * 1.6).toFixed(1)),
    aiAlignment: Number((8.5 + Math.random() * 1.4).toFixed(1))
  };

  const dimScoresB: Record<EvaluationDimension, number> = {
    productReasoning: Number((7.2 + Math.random() * 2.0).toFixed(1)),
    technicalFeasibility: Number((7.6 + Math.random() * 1.8).toFixed(1)),
    completeness: Number((7.4 + Math.random() * 2.0).toFixed(1)),
    relevance: Number((7.9 + Math.random() * 1.7).toFixed(1)),
    aiAlignment: Number((8.0 + Math.random() * 1.6).toFixed(1))
  };

  const weights = payload.weights || {
    productReasoning: 0.25,
    technicalFeasibility: 0.25,
    completeness: 0.20,
    relevance: 0.15,
    aiAlignment: 0.15
  };

  const compositeA = Number((
    dimScoresA.productReasoning * weights.productReasoning +
    dimScoresA.technicalFeasibility * weights.technicalFeasibility +
    dimScoresA.completeness * weights.completeness +
    dimScoresA.relevance * weights.relevance +
    dimScoresA.aiAlignment * weights.aiAlignment
  ).toFixed(1)) * 10;

  const compositeB = Number((
    dimScoresB.productReasoning * weights.productReasoning +
    dimScoresB.technicalFeasibility * weights.technicalFeasibility +
    dimScoresB.completeness * weights.completeness +
    dimScoresB.relevance * weights.relevance +
    dimScoresB.aiAlignment * weights.aiAlignment
  ).toFixed(1)) * 10;

  const winnerModelId = compositeA > compositeB ? modelA.id : compositeB > compositeA ? modelB.id : 'TIE';

  return {
    id: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    benchmarkId: payload.benchmarkId || `custom-${Date.now()}`,
    benchmarkTitle: payload.benchmarkTitle,
    category: payload.category,
    prompt: payload.customPrompt,
    timestamp: new Date().toISOString(),
    evaluationDimensionWeights: weights,
    modelA: {
      modelId: modelA.id,
      modelName: modelA.name,
      output: `### Analysis for: ${payload.benchmarkTitle}\n\n1. **Core Invariant Modeling**: Implements defensive verification barriers, transactional atomicity, and structured state machine guards.\n2. **Failure Domains**: Addresses network partitions, concurrent race conditions, and exponential backoff retry policies.\n3. **Trade-offs**: Prioritizes strict consistency and auditability over transient throughput.\n\n${payload.searchContext ? `> *Grounding Synthesis*: Integrated current documentation facts: "${payload.searchContext.slice(0, 180)}..."` : ''}`,
      latencyMs: latencyA,
      tokensOutput: tokensA,
      tokensPerSec: Number((tokensA / (latencyA / 1000)).toFixed(1)),
      costEstimatedUsd: Number(((tokensA / 1000000) * modelA.outputCostPer1M).toFixed(6)),
      compositeScore: Math.min(100, compositeA),
      dimensionScores: dimScoresA,
      rubricCritique: `${modelA.name} showed superior architectural rigor and explicit failure handling.`
    },
    modelB: {
      modelId: modelB.id,
      modelName: modelB.name,
      output: `### Strategic Assessment: ${payload.benchmarkTitle}\n\n- **Scalability & Topology**: Optimized for horizontal scale and low latency SLAs.\n- **Operational Cost**: Balances computational complexity against memory allocations.\n- **Implementation Nuances**: Recommends asynchronous queue decoupling and monotonic sequencing.\n\n${payload.searchContext ? `> *Grounded Context*: Referenced real-time web facts for domain validation.` : ''}`,
      latencyMs: latencyB,
      tokensOutput: tokensB,
      tokensPerSec: Number((tokensB / (latencyB / 1000)).toFixed(1)),
      costEstimatedUsd: Number(((tokensB / 1000000) * modelB.outputCostPer1M).toFixed(6)),
      compositeScore: Math.min(100, compositeB),
      dimensionScores: dimScoresB,
      rubricCritique: `${modelB.name} provided a concise and practical approach, though slightly less exhaustive on edge cases.`
    },
    verdict: {
      winnerModelId,
      confidenceScore: 0.88,
      winnerReasoning: winnerModelId === 'TIE' 
        ? 'Both models delivered equally compelling arguments with balanced trade-offs.' 
        : `${winnerModelId === modelA.id ? modelA.name : modelB.name} won due to higher precision in edge-case isolation, comprehensive failure modes, and adherence to specified constraints.`,
      comparativeAnalysis: `Evaluated using position-bias swapped Chain-of-Thought judge arbitration across 5 core dimensions.`
    }
  };
}

export async function simulateClientSearch(query: string): Promise<{ result: string; sources: { title: string; url: string }[] }> {
  await new Promise(r => setTimeout(r, 600));
  const lower = query.toLowerCase();

  if (lower.includes('elon') || lower.includes('musk')) {
    return {
      result: `Elon Musk is an entrepreneur, investor, and business magnate. He is the founder, CEO, and chief engineer at SpaceX; angel investor, CEO, and product architect of Tesla, Inc.; owner and CTO of X (formerly Twitter); founder of the Boring Company and xAI; and co-founder of Neuralink and OpenAI. He leads ventures in orbital rocketry, autonomous transport, satellite internet, and artificial intelligence.`,
      sources: [
        { title: 'Elon Musk — Wikipedia & Profile Overview', url: 'https://en.wikipedia.org/wiki/Elon_Musk' },
        { title: 'Tesla Executive Biographies', url: 'https://www.tesla.com/elon-musk' },
        { title: 'SpaceX Mission Architecture', url: 'https://www.spacex.com' }
      ]
    };
  }

  if (lower.includes('postgres') || lower.includes('sql')) {
    return {
      result: `PostgreSQL 17 enhances logical replication with active failover slot synchronization, upgraded parallel vacuum capabilities, and reduced WAL write amplification during multi-tenant workloads. Conflict detection in active-active topologies relies on origin-filtering and trigger-based last-write-wins or monotonic version sequence numbering.`,
      sources: [
        { title: 'PostgreSQL 17 Official Release Notes', url: 'https://www.postgresql.org/docs/17/release-17.html' },
        { title: 'PostgreSQL Logical Replication & Conflict Management', url: 'https://www.postgresql.org/docs/current/logical-replication.html' }
      ]
    };
  }

  if (lower.includes('oauth') || lower.includes('security')) {
    return {
      result: `OAuth 2.1 consolidates core OAuth 2.0 specifications and subsequent BCPs (Best Current Practices). Primary mandates include deprecation of the Implicit Grant flow and Resource Owner Password Credentials flow, requirement of PKCE (RFC 7636) for all authorization code grant clients, and exact URI string matching for redirect URIs.`,
      sources: [
        { title: 'IETF OAuth 2.1 Draft Specification', url: 'https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/' },
        { title: 'OAuth 2.0 Security Best Current Practice', url: 'https://oauth.net/2.1/' }
      ]
    };
  }

  return {
    result: `Real-time search synthesis for "${query}": Verified current industry specifications, documentation, and technical consensus. Key dimensions include architectural compliance, operational failure domains, scalability SLAs, and unit economic tradeoffs.`,
    sources: [
      { title: `Industry Technical Standards & Documentation (${query.slice(0, 30)})`, url: 'https://en.wikipedia.org' },
      { title: 'Verified Architecture & Engineering Registry', url: 'https://news.ycombinator.com' }
    ]
  };
}
