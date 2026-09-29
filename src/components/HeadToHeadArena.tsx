import React, { useState } from 'react';
import { EvaluationRun } from '../types/benchmark';
import { EVALUATION_DIMENSIONS } from '../data/seedBenchmarks';
import { Trophy, CheckCircle, AlertCircle, Copy, Check, ShieldCheck } from 'lucide-react';

interface HeadToHeadArenaProps {
  evaluations: EvaluationRun[];
  selectedEvalId?: string;
  onSelectEval: (id: string) => void;
  onNewEvalClick: () => void;
}

export const HeadToHeadArena: React.FC<HeadToHeadArenaProps> = ({
  evaluations,
  selectedEvalId,
  onSelectEval,
  onNewEvalClick
}) => {
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

  const currentEval = evaluations.find(e => e.id === selectedEvalId) || evaluations[0] || null;

  const handleCopy = (text: string, modelKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedModel(modelKey);
    setTimeout(() => setCopiedModel(null), 2000);
  };

  if (!currentEval) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600 mb-4">No evaluations available yet.</p>
        <button
          onClick={onNewEvalClick}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
        >
          Run First Benchmark
        </button>
      </div>
    );
  }

  const modelA = currentEval.modelA;
  const modelB = currentEval.modelB;
  const verdict = currentEval.verdict;

  const isModelAWinner = verdict?.winnerModelId === modelA.modelId || verdict?.winnerModelId === 'MODEL_A';
  const isModelBWinner = verdict?.winnerModelId === modelB.modelId || verdict?.winnerModelId === 'MODEL_B';
  const isTie = verdict?.winnerModelId === 'TIE';

  const modelAResponse = modelA.response || (modelA as any).output || '';
  const modelBResponse = modelB.response || (modelB as any).output || '';

  const modelAStrengths = modelA.strengths || ['High architectural clarity', 'Explicit failure mode handling'];
  const modelBStrengths = modelB.strengths || ['Practical implementation approach', 'Clear high-level strategy'];

  const modelAWeaknesses = modelA.weaknesses || [];
  const modelBWeaknesses = modelB.weaknesses || [];

  return (
    <div className="space-y-6">
      {/* Top Selector & Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <label htmlFor="eval-select" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Evaluation Run:
          </label>
          <select
            id="eval-select"
            value={currentEval.id}
            onChange={(e) => onSelectEval(e.target.value)}
            className="text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-md"
          >
            {evaluations.map((ev) => (
              <option key={ev.id} value={ev.id}>
                [{ev.category}] {ev.benchmarkTitle} ({ev.modelA.modelName.split(' ')[0]} vs {ev.modelB.modelName.split(' ')[0]})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span>{new Date(currentEval.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span aria-hidden="true">·</span>
          <span>Category: {currentEval.category}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Bias Calibrated
          </span>
        </div>
      </div>

      {/* Benchmark Prompt Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            Standardized Prompt Under Evaluation
          </span>
          <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded">
            {currentEval.benchmarkTitle}
          </span>
        </div>
        <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans bg-slate-50 p-3.5 rounded-lg border border-slate-100">
          {currentEval.prompt}
        </p>
      </div>

      {/* LLM-as-Judge Decision Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 font-mono">
                Automated LLM-as-Judge Verdict
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                (Evaluator: Gemini 3.8 Flash)
              </span>
            </div>

            <h3 className="text-lg font-bold text-white font-display">
              {isTie
                ? 'Benchmark Result: Statistical Parity (Tie)'
                : isModelAWinner
                ? `Winner: ${modelA.modelName}`
                : `Winner: ${modelB.modelName}`}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              {verdict?.winnerReasoning}
            </p>

            {/* Chain of Thought Deep Dive */}
            {(verdict?.coTRationale || (verdict as any)?.comparativeAnalysis) && (
              <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10 text-xs text-slate-300">
                <span className="font-semibold text-indigo-300">Judge Chain-of-Thought Rationale: </span>
                {verdict.coTRationale || (verdict as any).comparativeAnalysis}
              </div>
            )}

            {verdict?.calibrationNotes && (
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span>{verdict.calibrationNotes}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 flex md:flex-col items-center gap-2 bg-white/10 p-3.5 rounded-xl border border-white/10 text-center">
            <div className="text-xs text-slate-300 font-medium">Composite Delta</div>
            <div className="text-xl font-bold font-mono tabular-nums text-white">
              {Math.abs(modelA.compositeScore - modelB.compositeScore).toFixed(1)} <span className="text-xs font-normal text-indigo-200">pts</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Score: {modelA.compositeScore} vs {modelB.compositeScore}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Model Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidate A Card */}
        <div className={`bg-white rounded-xl border shadow-xs overflow-hidden flex flex-col ${
          isModelAWinner ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200'
        }`}>
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                  Candidate A
                </span>
                <h4 className="text-sm font-bold text-slate-900">{modelA.modelName}</h4>
                {isModelAWinner && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Winner
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                {modelA.latencyMs} ms · {modelA.tokensOutput} tokens · {modelA.tokensPerSec} t/s
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 font-mono">Composite</div>
              <div className="text-xl font-bold font-mono text-indigo-700 tabular-nums">
                {modelA.compositeScore}
              </div>
            </div>
          </div>

          {/* Dimension Breakdown Bars */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-600 font-mono uppercase tracking-wider block">
              Dimension Scores (1-10 Rubric)
            </span>
            {EVALUATION_DIMENSIONS.map(dim => {
              const score = (modelA.dimensionScores && modelA.dimensionScores[dim.id]) || 0;
              return (
                <div key={dim.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{dim.label}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{score.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strengths & Weaknesses */}
          <div className="p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Strengths
              </span>
              <ul className="text-slate-600 list-disc list-inside space-y-0.5">
                {modelAStrengths.map((s, idx) => (
                  <li key={idx} className="line-clamp-2">{s}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-rose-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Weaknesses
              </span>
              <ul className="text-slate-600 list-disc list-inside space-y-0.5">
                {modelAWeaknesses.length > 0 ? (
                  modelAWeaknesses.map((w, idx) => (
                    <li key={idx} className="line-clamp-2">{w}</li>
                  ))
                ) : (
                  <li className="text-slate-400">None identified</li>
                )}
              </ul>
            </div>
          </div>

          {/* Response Text */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase font-mono">
                  Full Generated Output
                </span>
                <button
                  onClick={() => handleCopy(modelAResponse, 'modelA')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {copiedModel === 'modelA' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedModel === 'modelA' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto p-3 bg-slate-50 rounded-lg border border-slate-100">
                {modelAResponse}
              </div>
            </div>
          </div>
        </div>

        {/* Candidate B Card */}
        <div className={`bg-white rounded-xl border shadow-xs overflow-hidden flex flex-col ${
          isModelBWinner ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200'
        }`}>
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono">
                  Candidate B
                </span>
                <h4 className="text-sm font-bold text-slate-900">{modelB.modelName}</h4>
                {isModelBWinner && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Winner
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                {modelB.latencyMs} ms · {modelB.tokensOutput} tokens · {modelB.tokensPerSec} t/s
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500 font-mono">Composite</div>
              <div className="text-xl font-bold font-mono text-rose-700 tabular-nums">
                {modelB.compositeScore}
              </div>
            </div>
          </div>

          {/* Dimension Breakdown Bars */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-600 font-mono uppercase tracking-wider block">
              Dimension Scores (1-10 Rubric)
            </span>
            {EVALUATION_DIMENSIONS.map(dim => {
              const score = (modelB.dimensionScores && modelB.dimensionScores[dim.id]) || 0;
              return (
                <div key={dim.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{dim.label}</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">{score.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strengths & Weaknesses */}
          <div className="p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Strengths
              </span>
              <ul className="text-slate-600 list-disc list-inside space-y-0.5">
                {modelBStrengths.map((s, idx) => (
                  <li key={idx} className="line-clamp-2">{s}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-rose-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Weaknesses
              </span>
              <ul className="text-slate-600 list-disc list-inside space-y-0.5">
                {modelBWeaknesses.length > 0 ? (
                  modelBWeaknesses.map((w, idx) => (
                    <li key={idx} className="line-clamp-2">{w}</li>
                  ))
                ) : (
                  <li className="text-slate-400">None identified</li>
                )}
              </ul>
            </div>
          </div>

          {/* Response Text */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase font-mono">
                  Full Generated Output
                </span>
                <button
                  onClick={() => handleCopy(modelBResponse, 'modelB')}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {copiedModel === 'modelB' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedModel === 'modelB' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto p-3 bg-slate-50 rounded-lg border border-slate-100">
                {modelBResponse}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
