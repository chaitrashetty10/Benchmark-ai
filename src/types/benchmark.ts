export type EvaluationDimension = 
  | 'productReasoning'
  | 'technicalFeasibility'
  | 'completeness'
  | 'relevance'
  | 'aiAlignment';

export interface DimensionConfig {
  id: EvaluationDimension;
  label: string;
  shortLabel: string;
  description: string;
  weight: number; // 0-1
  rubricAnchor10: string;
  rubricAnchor1: string;
}

export interface ModelProfile {
  id: string;
  name: string;
  provider: string;
  version: string;
  description: string;
  thinkingLevel?: 'HIGH' | 'LOW' | 'MINIMAL';
  systemPersona?: string;
  temperature: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  isCustom?: boolean;
}

export interface BenchmarkPrompt {
  id: string;
  title: string;
  category: 'Product Reasoning' | 'Technical Feasibility' | 'Completeness & Rigor' | 'Relevance & Precision' | 'AI Alignment & Safety';
  difficulty: 'Standard' | 'Advanced' | 'Hardcore';
  prompt: string;
  context?: string;
  groundTruthCriteria: string[];
  recommendedWeights?: Partial<Record<EvaluationDimension, number>>;
  tags: string[];
}

export interface DimensionScore {
  dimension: EvaluationDimension;
  score: number; // 1 to 10
  rationale: string;
}

export interface ModelRunOutput {
  modelId: string;
  modelName: string;
  response: string;
  latencyMs: number;
  tokensPrompt: number;
  tokensOutput: number;
  tokensPerSec: number;
  costEstimatedUsd: number;
  dimensionScores: Record<EvaluationDimension, number>;
  compositeScore: number; // 0 to 100
  strengths: string[];
  weaknesses: string[];
  groundingSources?: { title: string; url: string }[];
}

export interface JudgeVerdict {
  winnerModelId: string | 'TIE';
  winnerReasoning: string;
  coTRationale: string; // Chain of thought analysis
  calibrationNotes: string;
  orderSwappedVerification: boolean; // Position-bias mitigation
}

export interface EvaluationRun {
  id: string;
  benchmarkId: string;
  benchmarkTitle: string;
  category: string;
  prompt: string;
  timestamp: string;
  modelA: ModelRunOutput;
  modelB: ModelRunOutput;
  verdict: JudgeVerdict;
  weights: Record<EvaluationDimension, number>;
}

export interface ModelLeaderboardEntry {
  modelId: string;
  modelName: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number; // percentage
  avgCompositeScore: number;
  avgScores: Record<EvaluationDimension, number>;
  avgLatencyMs: number;
  avgTokensPerSec: number;
  avgCostPerQuery: number;
}
