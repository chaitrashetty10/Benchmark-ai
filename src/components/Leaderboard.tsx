import React, { useState } from 'react';
import { ModelLeaderboardEntry, ModelProfile, EvaluationDimension } from '../types/benchmark';
import { EVALUATION_DIMENSIONS, BENCHMARK_MODELS } from '../data/seedBenchmarks';
import { RadarChart } from './RadarChart';
import { Trophy, Zap, DollarSign, Activity, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface LeaderboardProps {
  leaderboardData: ModelLeaderboardEntry[];
  models: ModelProfile[];
  totalRuns: number;
  benchmarkCount: number;
  onSelectModelPairForEval: (modelAId: string, modelBId: string) => void;
  onInspectModelRuns: (modelId: string) => void;
}

const MODEL_COLORS: Record<string, string> = {
  'gemini-3.8-flash-deep': '#4F46E5', // Indigo
  'gemini-3.8-flash-strict': '#0D9488', // Teal
  'gemini-3.8-flash': '#D97706', // Amber
  'gemini-3.1-flash-lite': '#E11D48', // Rose
};

export const Leaderboard: React.FC<LeaderboardProps> = ({
  leaderboardData,
  totalRuns,
  benchmarkCount,
  onSelectModelPairForEval,
  onInspectModelRuns
}) => {
  const [selectedDimension, setSelectedDimension] = useState<EvaluationDimension | 'all'>('all');
  const [selectedForRadar, setSelectedForRadar] = useState<string[]>([
    'gemini-3.8-flash-deep',
    'gemini-3.8-flash-strict',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite'
  ]);

  const topModel = leaderboardData[0] || null;
  const avgLatency = Math.round(
    leaderboardData.reduce((acc, m) => acc + m.avgLatencyMs, 0) / (leaderboardData.length || 1)
  );

  const toggleRadarModel = (modelId: string) => {
    if (selectedForRadar.includes(modelId)) {
      if (selectedForRadar.length > 1) {
        setSelectedForRadar(selectedForRadar.filter(id => id !== modelId));
      }
    } else {
      setSelectedForRadar([...selectedForRadar, modelId]);
    }
  };

  const radarData = selectedForRadar.map(modelId => {
    const entry = leaderboardData.find(m => m.modelId === modelId);
    return {
      modelId,
      modelName: entry?.modelName || modelId,
      color: MODEL_COLORS[modelId] || '#6366F1',
      scores: entry?.avgScores || {
        productReasoning: 7,
        technicalFeasibility: 7,
        completeness: 7,
        relevance: 7,
        aiAlignment: 7
      }
    };
  });

  return (
    <div className="space-y-8">
      {/* Editorial Header & KPI Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Multi-Model Evaluation Leaderboard
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Quantitative ranking based on automated LLM-as-Judge scoring across 5 standardized rubrics with position-bias calibration and Elo updates.
          </p>
        </div>

        {/* Quiet metadata indicators */}
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span>{totalRuns} Total Evaluations</span>
          <span aria-hidden="true">·</span>
          <span>{benchmarkCount} Standardized Suites</span>
          <span aria-hidden="true">·</span>
          <span>Elo K-Factor: 32</span>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Top Ranked Model</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {topModel?.modelName || 'Gemini 3.8 Flash Deep'}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-mono">
            <span>Elo {topModel?.elo || 1620}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-medium">Win Rate {topModel?.winRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Mean Inference Latency</span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {avgLatency} <span className="text-sm font-normal text-slate-500">ms</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Fastest: {Math.min(...leaderboardData.map(m => m.avgLatencyMs))} ms (Flash-Lite)
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Benchmark Pairs</span>
            <Activity className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {totalRuns}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across 5 core rubric dimensions
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Evaluation Protocol</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-semibold text-slate-900">
            LLM-as-Judge CoT
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Gemini 3.8 Flash calibrated evaluator
          </div>
        </div>
      </div>

      {/* Spider Radar Chart & Multi-Dimension Comparison Panel */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Multi-Dimensional Capability Radar
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Visualizing normalized capability profiles across Product Reasoning, Technical Feasibility, Completeness, Relevance, and AI Alignment.
              </p>
            </div>

            {/* Model Radar Toggles */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Toggle Models in Radar:</span>
              <div className="flex flex-wrap gap-2">
                {BENCHMARK_MODELS.map(model => {
                  const isSelected = selectedForRadar.includes(model.id);
                  const color = MODEL_COLORS[model.id] || '#6366F1';
                  return (
                    <button
                      key={model.id}
                      onClick={() => toggleRadarModel(model.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-slate-50 border-slate-300 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: isSelected ? color : '#CBD5E1' }}
                      />
                      <span>{model.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rubric Dimension Overview List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {EVALUATION_DIMENSIONS.map(dim => (
                <div key={dim.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                  <div className="font-semibold text-slate-800">{dim.label}</div>
                  <div className="text-slate-500 mt-0.5 line-clamp-1">{dim.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center p-2">
            <RadarChart data={radarData} size={360} />
          </div>
        </div>
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Model Performance Rankings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sorted by Elo rating. Recalculated after every automated head-to-head match.
            </p>
          </div>

          {/* Dimension Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedDimension('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedDimension === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Dimensions
            </button>
            {EVALUATION_DIMENSIONS.map(dim => (
              <button
                key={dim.id}
                onClick={() => setSelectedDimension(dim.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedDimension === dim.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dim.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Model & Profile</th>
                <th className="py-3 px-4 text-right">Elo Rating</th>
                <th className="py-3 px-4 text-center">Record (W-L-T)</th>
                <th className="py-3 px-4 text-right">Win Rate</th>
                <th className="py-3 px-4 text-right">Composite (0-100)</th>
                <th className="py-3 px-4 text-right">Avg Latency</th>
                <th className="py-3 px-4 text-right">Tokens / sec</th>
                <th className="py-3 px-4 text-right">Cost / 1k queries</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboardData.map((row, index) => {
                const modelConfig = BENCHMARK_MODELS.find(m => m.id === row.modelId);
                const scoreToShow = selectedDimension === 'all'
                  ? row.avgCompositeScore
                  : (row.avgScores[selectedDimension] * 10);

                return (
                  <tr key={row.modelId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {index === 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs">1</span>
                      ) : index === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs">2</span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-900 text-xs">3</span>
                      ) : (
                        <span className="text-xs text-slate-400">{index + 1}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{row.modelName}</span>
                        {modelConfig?.thinkingLevel === 'HIGH' && (
                          <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono font-medium">
                            Thinking: High
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 max-w-sm line-clamp-1">
                        {modelConfig?.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {row.elo}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600 tabular-nums">
                      {row.wins}W - {row.losses}L - {row.ties}T
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium tabular-nums">
                      <span className={row.winRate >= 60 ? 'text-emerald-600' : row.winRate >= 45 ? 'text-slate-800' : 'text-rose-600'}>
                        {row.winRate.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${Math.min(100, scoreToShow)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {scoreToShow.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {row.avgLatencyMs} ms
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums">
                      {row.avgTokensPerSec.toFixed(0)} t/s
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 tabular-nums text-xs">
                      ${(row.avgCostPerQuery * 1000).toFixed(3)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onInspectModelRuns(row.modelId)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Inspect Evaluation Matches"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
