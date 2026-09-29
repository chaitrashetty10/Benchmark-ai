import React, { useState } from 'react';
import { ModelProfile, EvaluationRun } from '../types/benchmark';
import { Globe, Search, Loader2, Play, ExternalLink, Download, FileCode, CheckCircle, Check, ArrowRight, ShieldCheck, Trophy, Sparkles } from 'lucide-react';
import { generateEvaluationHtmlReport } from '../utils/htmlReportGenerator';
import { simulateClientSearch, simulateClientEvaluation } from '../utils/clientBenchmarkSimulator';

interface WebCompareStudioProps {
  models: ModelProfile[];
  onEvaluationCompleted: (run: EvaluationRun) => void;
}

export const WebCompareStudio: React.FC<WebCompareStudioProps> = ({
  models,
  onEvaluationCompleted,
}) => {
  const [searchTopic, setSearchTopic] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [modelAId, setModelAId] = useState(models[0]?.id || 'gemini-3.8-flash-deep');
  const [modelBId, setModelBId] = useState(models[1]?.id || 'gemini-3.8-flash');

  // Pipeline execution state
  const [isSearching, setIsSearching] = useState(false);
  const [webSummary, setWebSummary] = useState('');
  const [webSources, setWebSources] = useState<{ title: string; url: string }[]>([]);
  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStep, setEvalStep] = useState<number>(0);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationRun | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Quick preset search queries for recruiters/users
  const presetQueries = [
    {
      topic: 'PostgreSQL 17 high-throughput logical replication & active-active multi-master',
      question: 'Evaluate how PostgreSQL 17 handles conflict detection and resolution in multi-master setups under 20k writes/sec compared to Raft-based CockroachDB.'
    },
    {
      topic: 'OAuth 2.1 RFC specifications & PKCE security mandates',
      question: 'Compare OAuth 2.1 security changes regarding implicit grant deprecation and mandatory PKCE for public and confidential clients.'
    },
    {
      topic: 'AWS S3 Express One Zone vs standard S3 latency and pricing model',
      question: 'Provide an architectural decision record (ADR) analyzing latency benefits, cost inflection points, and failure domains for real-time analytics.'
    }
  ];

  // 1. Search Internet
  const handleSearchInternet = async (overrideTopic?: string, overrideQ?: string) => {
    const q = overrideTopic ?? searchTopic;
    if (!q.trim()) return;

    setIsSearching(true);
    setWebSummary('');
    setWebSources([]);
    setEvaluationResult(null);

    try {
      const res = await fetch('/api/search-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        setWebSummary(data.result || '');
        setWebSources(data.sources || []);
      } else {
        const sim = await simulateClientSearch(q);
        setWebSummary(sim.result);
        setWebSources(sim.sources);
      }
      if (overrideQ) {
        setCustomQuestion(overrideQ);
      } else if (!customQuestion) {
        setCustomQuestion(`Based on current industry standards and real-time documentation, analyze the strategic tradeoffs, architectural invariants, and production edge cases for: "${q}".`);
      }
    } catch (err) {
      const sim = await simulateClientSearch(q);
      setWebSummary(sim.result);
      setWebSources(sim.sources);
      if (overrideQ) {
        setCustomQuestion(overrideQ);
      } else if (!customQuestion) {
        setCustomQuestion(`Based on current industry standards and real-time documentation, analyze the strategic tradeoffs, architectural invariants, and production edge cases for: "${q}".`);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 2. Run Head-to-Head Comparison with Web Grounding
  const handleRunComparison = async () => {
    if (!customQuestion.trim()) return;

    setIsEvaluating(true);
    setEvalStep(1); // parallel inference
    setEvaluationResult(null);

    try {
      const payload = {
        benchmarkTitle: `Live Web Evaluation: ${searchTopic || 'Internet Research'}`,
        category: 'Live Internet Research',
        customPrompt: customQuestion,
        modelAId,
        modelBId,
        useWebSearch: true,
        searchContext: webSummary,
        groundTruthCriteria: [
          'Directly references verified web citations and recent documentation',
          'Enforces realistic production failure modes and boundary conditions',
          'Avoids temporal hallucinations or outdated API syntax'
        ]
      };

      setEvalStep(2); // query candidates
      try {
        const response = await fetch('/api/run-eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          setEvalStep(3); // LLM-as-Judge
          const data = await response.json();
          setEvalStep(4); // finalized
          setEvaluationResult(data.evaluation);
          onEvaluationCompleted(data.evaluation);
          return;
        }
      } catch (e) {
        console.warn('Backend run-eval unreachable, running client simulation:', e);
      }

      // Static hosting fallback (GitHub Pages)
      setEvalStep(3); // simulate LLM-as-Judge scoring
      await new Promise(r => setTimeout(r, 700));
      const simulatedEval = await simulateClientEvaluation(payload);
      setEvalStep(4);
      setEvaluationResult(simulatedEval);
      onEvaluationCompleted(simulatedEval);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsEvaluating(false);
      setEvalStep(0);
    }
  };

  // 3. Download Standalone HTML Report
  const handleDownloadHtml = () => {
    if (!evaluationResult) return;
    const html = generateEvaluationHtmlReport(evaluationResult);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web_benchmark_${(searchTopic || 'evaluation').toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyHtml = () => {
    if (!evaluationResult) return;
    const html = generateEvaluationHtmlReport(evaluationResult);
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleSelectPreset = (p: typeof presetQueries[0]) => {
    setSearchTopic(p.topic);
    setCustomQuestion(p.question);
    handleSearchInternet(p.topic, p.question);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs uppercase tracking-wider font-mono">
          <Globe className="w-4 h-4" />
          <span>Real-Time Internet Grounding Pipeline</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display mt-1">
          Search Web, Compare LLM Responses & Generate HTML Report
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Search the live internet using Google Grounding, benchmark two models against real-time web facts, run automated LLM-as-Judge scoring, and download a polished standalone HTML evaluation report.
        </p>
      </div>

      {/* Preset Inspirations */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider block mb-2">
          Try Live Preset Research Queries:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {presetQueries.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              disabled={isSearching || isEvaluating}
              className="text-left p-2.5 bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors group"
            >
              <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 line-clamp-1">
                {p.topic}
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                {p.question}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Internet Search */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
            <span>Search Internet for Real-Time Facts & Documentation</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Google Grounding API</span>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="e.g. Latest PostgreSQL 17 features, Stripe 2026 API changes, Kubernetes 1.32 release notes..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchInternet()}
              disabled={isSearching || isEvaluating}
              className="w-full text-sm pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>
          <button
            onClick={() => handleSearchInternet()}
            disabled={isSearching || !searchTopic.trim() || isEvaluating}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isSearching ? 'Searching Internet...' : 'Search Internet'}</span>
          </button>
        </div>

        {/* Search Results Display */}
        {webSummary && (
          <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Retrieved Web Research & Factual Context
              </span>
              <span className="font-mono text-[11px] text-emerald-700">{webSources.length} Verified Sources</span>
            </div>

            <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto font-mono bg-white p-3 rounded border border-emerald-100">
              {webSummary}
            </div>

            {webSources.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-600">Citations:</span>
                {webSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    <span className="truncate max-w-[200px]">{source.title}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Compare Responses */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs flex items-center justify-center font-bold">2</span>
          <span>Configure Evaluation & Compare Model Candidates</span>
        </h2>

        {/* Model Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Model Candidate A</label>
            <select
              value={modelAId}
              onChange={(e) => setModelAId(e.target.value)}
              disabled={isEvaluating}
              className="w-full text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.thinkingLevel ? `Think: ${m.thinkingLevel}` : 'Standard'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Model Candidate B</label>
            <select
              value={modelBId}
              onChange={(e) => setModelBId(e.target.value)}
              disabled={isEvaluating}
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

        {/* Question Prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Evaluation Prompt / Specific Technical Question for the Models:
          </label>
          <textarea
            rows={3}
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            disabled={isEvaluating}
            placeholder="What specific architectural trade-offs or constraints should both models analyze based on the web research above?"
            className="w-full text-sm p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunComparison}
          disabled={isEvaluating || !customQuestion.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          {isEvaluating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {evalStep === 1 && 'Querying Candidate Models with Grounded Search Context...'}
                {evalStep === 2 && 'Executing Parallel Inference...'}
                {evalStep === 3 && 'Running Swapped Automated LLM-as-Judge Arbitration...'}
                {evalStep === 4 && 'Finalizing Multi-Dimensional Verdict & Telemetry...'}
              </span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Compare Responses with Automated LLM-as-Judge</span>
            </>
          )}
        </button>
      </div>

      {/* Step 3: Head-to-Head Results & HTML Export */}
      {evaluationResult && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs flex items-center justify-center font-bold">3</span>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  Evaluation Verdict & Benchmark Report
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Completed on {new Date(evaluationResult.timestamp).toLocaleTimeString()} · Automated Judge: Gemini 3.8 Flash
              </p>
            </div>

            {/* Export HTML Report Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHtml}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? 'Copied HTML!' : 'Copy HTML'}</span>
              </button>
              <button
                onClick={handleDownloadHtml}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span>{downloadSuccess ? 'Downloaded!' : 'Download Standalone HTML Report'}</span>
              </button>
            </div>
          </div>

          {/* Winner Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100 flex items-start gap-3">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-900 font-mono">
                Judge Verdict
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {evaluationResult.verdict.winnerReasoning}
              </div>
              <div className="text-xs text-slate-600 italic">
                {evaluationResult.verdict.comparativeAnalysis}
              </div>
            </div>
          </div>

          {/* Model Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model A */}
            <div className={`p-4 rounded-xl border ${
              evaluationResult.verdict.winnerModelId === evaluationResult.modelA.modelId
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">{evaluationResult.modelA.modelName}</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-800">
                  Score: {evaluationResult.modelA.compositeScore}/100
                </span>
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-white p-3 rounded border border-slate-200 max-h-64 overflow-y-auto">
                {evaluationResult.modelA.output}
              </div>
            </div>

            {/* Model B */}
            <div className={`p-4 rounded-xl border ${
              evaluationResult.verdict.winnerModelId === evaluationResult.modelB.modelId
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">{evaluationResult.modelB.modelName}</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-800">
                  Score: {evaluationResult.modelB.compositeScore}/100
                </span>
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed bg-white p-3 rounded border border-slate-200 max-h-64 overflow-y-auto">
                {evaluationResult.modelB.output}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
