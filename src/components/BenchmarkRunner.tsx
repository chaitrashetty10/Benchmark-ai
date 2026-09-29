import React, { useState } from 'react';
import { BenchmarkPrompt, ModelProfile, EvaluationDimension, EvaluationRun } from '../types/benchmark';
import { EVALUATION_DIMENSIONS } from '../data/seedBenchmarks';
import { Play, Sparkles, Sliders, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface BenchmarkRunnerProps {
  benchmarks: BenchmarkPrompt[];
  models: ModelProfile[];
  onEvaluationCompleted: (run: EvaluationRun) => void;
  preselectedBenchmarkId?: string;
  preselectedModelAId?: string;
  preselectedModelBId?: string;
}

export const BenchmarkRunner: React.FC<BenchmarkRunnerProps> = ({
  benchmarks,
  models,
  onEvaluationCompleted,
  preselectedBenchmarkId,
  preselectedModelAId,
  preselectedModelBId
}) => {
  const [selectedPromptMode, setSelectedPromptMode] = useState<'standard' | 'custom'>('standard');
  const [selectedBmId, setSelectedBmId] = useState<string>(preselectedBenchmarkId || benchmarks[0]?.id || '');
  
  // Custom prompt state
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Technical Feasibility');
  const [customPromptText, setCustomPromptText] = useState('');
  const [customCriteria, setCustomCriteria] = useState('');

  // Selected models
  const [modelAId, setModelAId] = useState<string>(preselectedModelAId || models[0]?.id || 'gemini-3.8-flash-deep');
  const [modelBId, setModelBId] = useState<string>(preselectedModelBId || models[1]?.id || 'gemini-3.8-flash');

  // Weights (normalized to sum to 1)
  const [weights, setWeights] = useState<Record<EvaluationDimension, number>>({
    productReasoning: 0.25,
    technicalFeasibility: 0.25,
    completeness: 0.20,
    relevance: 0.15,
    aiAlignment: 0.15
  });

  // Runner state
  const [isRunning, setIsRunning] = useState(false);
  const [runStep, setRunStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedBm = benchmarks.find(b => b.id === selectedBmId) || benchmarks[0];

  const handleWeightChange = (dim: EvaluationDimension, val: number) => {
    setWeights(prev => ({
      ...prev,
      [dim]: val
    }));
  };

  const handleRun = async () => {
    if (modelAId === modelBId) {
      setErrorMsg('Please select two distinct model configurations for head-to-head evaluation.');
      return;
    }

    if (selectedPromptMode === 'custom' && (!customTitle.trim() || !customPromptText.trim())) {
      setErrorMsg('Please provide a title and prompt text for custom benchmark.');
      return;
    }

    setErrorMsg(null);
    setIsRunning(true);
    setRunStep(1);

    try {
      // Step 1: Ingestion
      await new Promise(r => setTimeout(r, 400));
      setRunStep(2); // Parallel inference

      const payload = {
        benchmarkId: selectedPromptMode === 'standard' ? selectedBm.id : undefined,
        benchmarkTitle: selectedPromptMode === 'standard' ? selectedBm.title : customTitle,
        category: selectedPromptMode === 'standard' ? selectedBm.category : customCategory,
        customPrompt: selectedPromptMode === 'custom' ? customPromptText : selectedBm.prompt,
        modelAId,
        modelBId,
        weights,
        groundTruthCriteria: selectedPromptMode === 'standard' 
          ? selectedBm.groundTruthCriteria 
          : customCriteria.split('\n').filter(c => c.trim().length > 0)
      };

      const response = await fetch('/api/run-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setRunStep(3); // LLM-as-Judge scoring
      await new Promise(r => setTimeout(r, 500));

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Evaluation failed on server');
      }

      setRunStep(4); // Recalculating Elo
      await new Promise(r => setTimeout(r, 400));

      const result = await response.json();
      setIsRunning(false);
      setRunStep(0);

      onEvaluationCompleted(result.evaluation);
    } catch (err: any) {
      console.error('Run failed:', err);
      setErrorMsg(err.message || 'An error occurred during evaluation');
      setIsRunning(false);
      setRunStep(0);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
          Interactive Benchmark Execution Studio
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Configure multi-model matchups against standardized prompts or custom edge-case scenarios with automated LLM-as-Judge evaluation.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Model Selection Pairing */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Candidate Model Pairing</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Model Candidate A</label>
            <select
              value={modelAId}
              onChange={(e) => setModelAId(e.target.value)}
              disabled={isRunning}
              className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.thinkingLevel ? `Think: ${m.thinkingLevel}` : 'Standard'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Model Candidate B</label>
            <select
              value={modelBId}
              onChange={(e) => setModelBId(e.target.value)}
              disabled={isRunning}
              className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.thinkingLevel ? `Think: ${m.thinkingLevel}` : 'Standard'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Benchmark Prompt Selection */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 font-display">
            Benchmark Prompt & Ground Truth
          </h2>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedPromptMode('standard')}
              disabled={isRunning}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedPromptMode === 'standard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Standardized Suite
            </button>
            <button
              onClick={() => setSelectedPromptMode('custom')}
              disabled={isRunning}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedPromptMode === 'custom'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom Test Scenario
            </button>
          </div>
        </div>

        {selectedPromptMode === 'standard' ? (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700">Select Standardized Benchmark:</label>
            <select
              value={selectedBmId}
              onChange={(e) => setSelectedBmId(e.target.value)}
              disabled={isRunning}
              className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              {benchmarks.map(b => (
                <option key={b.id} value={b.id}>
                  [{b.category} - {b.difficulty}] {b.title}
                </option>
              ))}
            </select>

            {selectedBm && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-mono">
                  {selectedBm.prompt}
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    Calibrated Ground-Truth Criteria ({selectedBm.groundTruthCriteria.length} checkpoints):
                  </span>
                  <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                    {selectedBm.groundTruthCriteria.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Scenario Title</label>
                <input
                  type="text"
                  placeholder="e.g. Rate Limiting under Multi-DC Clock Skew"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  disabled={isRunning}
                  className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  disabled={isRunning}
                  className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="Product Reasoning">Product Reasoning</option>
                  <option value="Technical Feasibility">Technical Feasibility</option>
                  <option value="Completeness & Rigor">Completeness & Rigor</option>
                  <option value="Relevance & Precision">Relevance & Precision</option>
                  <option value="AI Alignment & Safety">AI Alignment & Safety</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Test Prompt</label>
              <textarea
                rows={4}
                placeholder="Enter prompt with explicit constraints and system requirements..."
                value={customPromptText}
                onChange={(e) => setCustomPromptText(e.target.value)}
                disabled={isRunning}
                className="w-full text-xs font-mono text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-3"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Ground Truth Criteria (One criterion per line for Judge calibration)
              </label>
              <textarea
                rows={3}
                placeholder="- Mentions monotonic clocks to avoid NTP rollback&#10;- Specifies sliding window counter algorithm&#10;- Addresses WAN latency fallback"
                value={customCriteria}
                onChange={(e) => setCustomCriteria(e.target.value)}
                disabled={isRunning}
                className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-3"
              />
            </div>
          </div>
        )}
      </div>

      {/* Rubric Weight Calibration */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Rubric Weight Calibration</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Customizes Judge Composite Score
          </span>
        </div>

        <div className="space-y-3">
          {EVALUATION_DIMENSIONS.map(dim => {
            const currentWeight = weights[dim.id] ?? dim.weight;
            return (
              <div key={dim.id} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">{dim.label}</span>
                  <span className="font-mono text-slate-900">{Math.round(currentWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.05"
                  value={currentWeight}
                  onChange={(e) => handleWeightChange(dim.id, parseFloat(e.target.value))}
                  disabled={isRunning}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Runner Execution Progress & Trigger */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        {isRunning && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Harness Running Pipeline...</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className={`p-2 rounded border font-mono ${runStep >= 1 ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                1. Ingestion
              </div>
              <div className={`p-2 rounded border font-mono ${runStep >= 2 ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                2. Parallel Inference
              </div>
              <div className={`p-2 rounded border font-mono ${runStep >= 3 ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                3. LLM-as-Judge
              </div>
              <div className={`p-2 rounded border font-mono ${runStep >= 4 ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                4. Elo Update
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 text-sm transition-colors"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Executing Automated Benchmark Harness...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run Automated Benchmark Evaluation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
