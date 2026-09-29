/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Leaderboard } from './components/Leaderboard';
import { HeadToHeadArena } from './components/HeadToHeadArena';
import { BenchmarkRunner } from './components/BenchmarkRunner';
import { WebCompareStudio } from './components/WebCompareStudio';
import { PromptCatalog } from './components/PromptCatalog';
import { PairwiseMatrix } from './components/PairwiseMatrix';
import { MethodologyModal } from './components/MethodologyModal';
import { ExportModal } from './components/ExportModal';

import { EvaluationRun, ModelProfile, BenchmarkPrompt, ModelLeaderboardEntry, EvaluationDimension } from './types/benchmark';
import { BENCHMARK_MODELS, STANDARDIZED_BENCHMARKS, INITIAL_EVALUATION_RUNS, EVALUATION_DIMENSIONS } from './data/seedBenchmarks';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('leaderboard');
  const [models, setModels] = useState<ModelProfile[]>(BENCHMARK_MODELS);
  const [benchmarks, setBenchmarks] = useState<BenchmarkPrompt[]>(STANDARDIZED_BENCHMARKS);
  const [evaluations, setEvaluations] = useState<EvaluationRun[]>(INITIAL_EVALUATION_RUNS);

  const [selectedEvalId, setSelectedEvalId] = useState<string>(INITIAL_EVALUATION_RUNS[0]?.id || '');
  const [preselectedBmId, setPreselectedBmId] = useState<string | undefined>(undefined);
  const [preselectedModelA, setPreselectedModelA] = useState<string | undefined>(undefined);
  const [preselectedModelB, setPreselectedModelB] = useState<string | undefined>(undefined);

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Fetch initial data from server on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [modelsRes, benchmarksRes, evalsRes] = await Promise.all([
          fetch('/api/models'),
          fetch('/api/benchmarks'),
          fetch('/api/evaluations')
        ]);

        if (modelsRes.ok) {
          const mData = await modelsRes.json();
          if (mData.models?.length) setModels(mData.models);
        }
        if (benchmarksRes.ok) {
          const bData = await benchmarksRes.json();
          if (bData.benchmarks?.length) setBenchmarks(bData.benchmarks);
        }
        if (evalsRes.ok) {
          const eData = await evalsRes.json();
          if (eData.evaluations?.length) {
            setEvaluations(eData.evaluations);
            setSelectedEvalId(eData.evaluations[0]?.id || '');
          }
        }
      } catch (err) {
        console.warn('Backend loading warning; using client seed state:', err);
      }
    }
    loadData();
  }, []);

  // Compute dynamic Elo ratings and statistics from evaluation runs
  const leaderboardData: ModelLeaderboardEntry[] = useMemo(() => {
    const eloMap: Record<string, number> = {};
    const statsMap: Record<string, {
      wins: number;
      losses: number;
      ties: number;
      compositeScores: number[];
      dimScores: Record<EvaluationDimension, number[]>;
      latencies: number[];
      velocities: number[];
      costs: number[];
    }> = {};

    // Initialize all models
    models.forEach(m => {
      eloMap[m.id] = 1500;
      statsMap[m.id] = {
        wins: 0,
        losses: 0,
        ties: 0,
        compositeScores: [],
        dimScores: {
          productReasoning: [],
          technicalFeasibility: [],
          completeness: [],
          relevance: [],
          aiAlignment: []
        },
        latencies: [],
        velocities: [],
        costs: []
      };
    });

    const K = 32;

    // Process evaluation runs in chronological order for Elo
    const sortedRuns = [...evaluations].reverse();

    sortedRuns.forEach(run => {
      const idA = run.modelA.modelId;
      const idB = run.modelB.modelId;

      if (!statsMap[idA]) {
        statsMap[idA] = { wins: 0, losses: 0, ties: 0, compositeScores: [], dimScores: { productReasoning: [], technicalFeasibility: [], completeness: [], relevance: [], aiAlignment: [] }, latencies: [], velocities: [], costs: [] };
        eloMap[idA] = 1500;
      }
      if (!statsMap[idB]) {
        statsMap[idB] = { wins: 0, losses: 0, ties: 0, compositeScores: [], dimScores: { productReasoning: [], technicalFeasibility: [], completeness: [], relevance: [], aiAlignment: [] }, latencies: [], velocities: [], costs: [] };
        eloMap[idB] = 1500;
      }

      // Record metrics
      statsMap[idA].compositeScores.push(run.modelA.compositeScore);
      statsMap[idA].latencies.push(run.modelA.latencyMs);
      statsMap[idA].velocities.push(run.modelA.tokensPerSec);
      statsMap[idA].costs.push(run.modelA.costEstimatedUsd);

      statsMap[idB].compositeScores.push(run.modelB.compositeScore);
      statsMap[idB].latencies.push(run.modelB.latencyMs);
      statsMap[idB].velocities.push(run.modelB.tokensPerSec);
      statsMap[idB].costs.push(run.modelB.costEstimatedUsd);

      EVALUATION_DIMENSIONS.forEach(d => {
        statsMap[idA].dimScores[d.id].push(run.modelA.dimensionScores[d.id] || 7);
        statsMap[idB].dimScores[d.id].push(run.modelB.dimensionScores[d.id] || 7);
      });

      // Match outcome
      const winner = run.verdict.winnerModelId;
      let scoreA = 0.5;
      let scoreB = 0.5;

      if (winner === idA || winner === 'MODEL_A') {
        statsMap[idA].wins++;
        statsMap[idB].losses++;
        scoreA = 1.0;
        scoreB = 0.0;
      } else if (winner === idB || winner === 'MODEL_B') {
        statsMap[idB].wins++;
        statsMap[idA].losses++;
        scoreA = 0.0;
        scoreB = 1.0;
      } else {
        statsMap[idA].ties++;
        statsMap[idB].ties++;
      }

      // Elo formula
      const rA = eloMap[idA];
      const rB = eloMap[idB];
      const expectedA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
      const expectedB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

      eloMap[idA] = Math.round(rA + K * (scoreA - expectedA));
      eloMap[idB] = Math.round(rB + K * (scoreB - expectedB));
    });

    return models.map(m => {
      const stats = statsMap[m.id];
      const totalMatches = stats.wins + stats.losses + stats.ties;
      const winRate = totalMatches > 0 ? ((stats.wins + 0.5 * stats.ties) / totalMatches) * 100 : 50.0;

      const avgComposite = stats.compositeScores.length > 0
        ? stats.compositeScores.reduce((a, b) => a + b, 0) / stats.compositeScores.length
        : 75.0;

      const avgScores: Record<EvaluationDimension, number> = {
        productReasoning: 7,
        technicalFeasibility: 7,
        completeness: 7,
        relevance: 7,
        aiAlignment: 7
      };

      EVALUATION_DIMENSIONS.forEach(d => {
        const arr = stats.dimScores[d.id];
        avgScores[d.id] = arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : 7.0;
      });

      const avgLatency = stats.latencies.length > 0
        ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length)
        : 800;

      const avgVelocity = stats.velocities.length > 0
        ? Math.round(stats.velocities.reduce((a, b) => a + b, 0) / stats.velocities.length)
        : 350;

      const avgCost = stats.costs.length > 0
        ? stats.costs.reduce((a, b) => a + b, 0) / stats.costs.length
        : 0.0002;

      return {
        modelId: m.id,
        modelName: m.name,
        elo: eloMap[m.id] || 1500,
        matchesPlayed: totalMatches,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        winRate,
        avgCompositeScore: Number(avgComposite.toFixed(1)),
        avgScores,
        avgLatencyMs: avgLatency,
        avgTokensPerSec: avgVelocity,
        avgCostPerQuery: avgCost
      };
    }).sort((a, b) => b.elo - a.elo);
  }, [models, evaluations]);

  // Handler when a new evaluation run is completed
  const handleEvaluationCompleted = (newRun: EvaluationRun) => {
    setEvaluations(prev => [newRun, ...prev]);
    setSelectedEvalId(newRun.id);
    setActiveTab('arena');
  };

  // Navigations
  const handleSelectPairForEval = (modelAId: string, modelBId: string) => {
    setPreselectedModelA(modelAId);
    setPreselectedModelB(modelBId);
    setActiveTab('runner');
  };

  const handleInspectModelRuns = (modelId: string) => {
    const match = evaluations.find(e => e.modelA.modelId === modelId || e.modelB.modelId === modelId);
    if (match) {
      setSelectedEvalId(match.id);
    }
    setActiveTab('arena');
  };

  const handleLoadBenchmarkInStudio = (bmId: string) => {
    setPreselectedBmId(bmId);
    setActiveTab('runner');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenRunner={() => setActiveTab('runner')}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'leaderboard' && (
          <Leaderboard
            leaderboardData={leaderboardData}
            models={models}
            totalRuns={evaluations.length}
            benchmarkCount={benchmarks.length}
            onSelectModelPairForEval={handleSelectPairForEval}
            onInspectModelRuns={handleInspectModelRuns}
          />
        )}

        {activeTab === 'web-compare' && (
          <WebCompareStudio
            models={models}
            onEvaluationCompleted={handleEvaluationCompleted}
          />
        )}

        {activeTab === 'arena' && (
          <HeadToHeadArena
            evaluations={evaluations}
            selectedEvalId={selectedEvalId}
            onSelectEval={setSelectedEvalId}
            onNewEvalClick={() => setActiveTab('runner')}
          />
        )}

        {activeTab === 'runner' && (
          <BenchmarkRunner
            benchmarks={benchmarks}
            models={models}
            onEvaluationCompleted={handleEvaluationCompleted}
            preselectedBenchmarkId={preselectedBmId}
            preselectedModelAId={preselectedModelA}
            preselectedModelBId={preselectedModelB}
          />
        )}

        {activeTab === 'catalog' && (
          <PromptCatalog
            benchmarks={benchmarks}
            onLoadInStudio={handleLoadBenchmarkInStudio}
          />
        )}

        {activeTab === 'matrix' && (
          <PairwiseMatrix
            models={models}
            evaluations={evaluations}
            onSelectPair={handleSelectPairForEval}
          />
        )}
      </main>

      {/* Quiet, minimalist engineering footer conforming to anti-slop rules */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div>
            <span>BenchMarkAI Multi-Model Evaluation Harness</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Gemini 3.8 LLM-as-Judge</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Evaluation Architecture
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsExportOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Export JSON/CSV
            </button>
          </div>
        </div>
      </footer>

      {/* Methodology & Architecture Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      {/* Export Report Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        evaluations={evaluations}
        leaderboardData={leaderboardData}
      />
    </div>
  );
}
