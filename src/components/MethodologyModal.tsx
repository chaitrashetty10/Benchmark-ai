import React from 'react';
import { X, CheckCircle, ShieldCheck, Scale, Cpu, Brain, Award } from 'lucide-react';
import { EVALUATION_DIMENSIONS } from '../data/seedBenchmarks';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              System Architecture & Evaluation Methodology
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Scientific rigor, position-bias mitigation, and Elo mathematics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-sm text-slate-700 leading-relaxed font-sans">
          {/* Executive Overview */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold font-display">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Resume & Engineering Architecture Brief</span>
            </div>
            <p className="text-xs text-indigo-950 leading-relaxed">
              This harness demonstrates production-grade AI system evaluation for enterprise deployment. Instead of relying on ungrounded single-number scores or simple pattern matching, it implements calibrated <strong>LLM-as-Judge evaluation</strong> with structured CoT (Chain-of-Thought) critique, position-bias swap mitigation, and dynamic Elo updates across 5 enterprise-critical dimensions.
            </p>
          </div>

          {/* Section 1: The 5 Rubric Dimensions */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-600" />
              <span>1. Standardized 5-Dimensional Rubric Anchors</span>
            </h3>
            <p className="text-xs text-slate-600">
              Each candidate model output is graded on a calibrated 1.0 to 10.0 scale against explicit anchors:
            </p>

            <div className="space-y-2.5">
              {EVALUATION_DIMENSIONS.map(dim => (
                <div key={dim.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{dim.label}</span>
                    <span className="font-mono text-indigo-600">Default Weight: {Math.round(dim.weight * 100)}%</span>
                  </div>
                  <div className="text-slate-600">{dim.description}</div>
                  <div className="pt-1.5 border-t border-slate-200 text-[11px] space-y-0.5 font-mono">
                    <div className="text-emerald-700"><strong>Anchor 10.0:</strong> {dim.rubricAnchor10}</div>
                    <div className="text-rose-700"><strong>Anchor 1.0:</strong> {dim.rubricAnchor1}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Position Bias Mitigation */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>2. Mitigating LLM-as-Judge Systematic Biases</span>
            </h3>
            <p className="text-xs text-slate-600">
              Standard LLM evaluators suffer from documented cognitive biases:
            </p>
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1.5 pl-1">
              <li>
                <strong>Position Bias (First-Token Primacy):</strong> LLM judges often prefer whichever candidate response appears first in the prompt. We mitigate this through automated position swap verification (testing order A-B and B-A to confirm verdict stability).
              </li>
              <li>
                <strong>Verbosity Bias:</strong> Models with longer answers often receive artificially inflated scores. Our judge penalizes fluff and explicitly checks for direct signal-to-noise ratio in the <em>Relevance</em> dimension.
              </li>
              <li>
                <strong>Chain-of-Thought Rationale Requirement:</strong> The judge must generate explicit qualitative critique and enumerate verified ground-truth criteria before emitting final numerical scores.
              </li>
            </ul>
          </div>

          {/* Section 3: Elo Rating Mathematics */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-600" />
              <span>3. Dynamic Elo Rating Algorithm</span>
            </h3>
            <p className="text-xs text-slate-600">
              Model rankings are modeled using the standard chess Elo system ($K=32$):
            </p>
            <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs space-y-2">
              <div>
                <span className="text-slate-400"># Expected win probability for Model A:</span>
                <br />
                <span className="text-indigo-300">E_A = 1 / (1 + 10^((R_B - R_A) / 400))</span>
              </div>
              <div>
                <span className="text-slate-400"># Elo update after match (S_A: 1 for Win, 0.5 for Tie, 0 for Loss):</span>
                <br />
                <span className="text-emerald-300">R_A' = R_A + K * (S_A - E_A)</span>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              This ensures that defeating a higher-ranked model yields a substantially larger rating delta than defeating an inferior baseline.
            </p>
          </div>

          {/* Section 4: Full Stack Architecture */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span>4. Full-Stack Production Architecture</span>
            </h3>
            <p className="text-xs text-slate-600">
              Built on a modern TypeScript stack:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Backend Engine:</strong> Express + tsx server running on Node.js with Google GenAI SDK (@google/genai 2.4.0)
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Frontend:</strong> React 19 + Vite 8 with Tailwind CSS v4, dynamic SVG Radar Charts, and zero external charting bloat
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Evaluator Model:</strong> Gemini 3.8 Flash configured with structured JSON schema output
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                <strong>Latency Telemetry:</strong> High-precision monotonic execution timers & token velocity tracking
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
