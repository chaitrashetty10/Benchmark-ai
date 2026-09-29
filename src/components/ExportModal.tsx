import React, { useState } from 'react';
import { X, Download, Copy, Check, FileJson, FileText, Table, Globe, FileCode } from 'lucide-react';
import { EvaluationRun, ModelLeaderboardEntry } from '../types/benchmark';
import { generateLeaderboardPortfolioHtml } from '../utils/htmlReportGenerator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluations: EvaluationRun[];
  leaderboardData: ModelLeaderboardEntry[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  evaluations,
  leaderboardData
}) => {
  const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json' | 'csv'>('html');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate Markdown summary
  const generateMarkdown = () => {
    let md = `# Multi-Model AI Benchmark Evaluation Report\n`;
    md += `Generated: ${new Date().toISOString()}\n\n`;

    md += `## 1. Model Leaderboard (Elo Ratings & Composite Scores)\n\n`;
    md += `| Rank | Model | Elo | Record (W-L-T) | Win Rate | Composite Score | Latency (ms) | Velocity (t/s) |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    leaderboardData.forEach((row, i) => {
      md += `| ${i + 1} | ${row.modelName} | ${row.elo} | ${row.wins}W-${row.losses}L-${row.ties}T | ${row.winRate.toFixed(1)}% | ${row.avgCompositeScore.toFixed(1)}/100 | ${row.avgLatencyMs}ms | ${row.avgTokensPerSec.toFixed(0)} |\n`;
    });

    md += `\n## 2. Standardized Dimension Breakdowns (1-10 Rubric)\n\n`;
    md += `| Model | Product Reasoning | Technical Feasibility | Completeness | Relevance | AI Alignment |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    leaderboardData.forEach(row => {
      md += `| ${row.modelName} | ${row.avgScores.productReasoning.toFixed(1)} | ${row.avgScores.technicalFeasibility.toFixed(1)} | ${row.avgScores.completeness.toFixed(1)} | ${row.avgScores.relevance.toFixed(1)} | ${row.avgScores.aiAlignment.toFixed(1)} |\n`;
    });

    md += `\n## 3. Evaluated Head-to-Head Matches (${evaluations.length})\n\n`;
    evaluations.forEach((ev, i) => {
      md += `### Match ${i + 1}: ${ev.benchmarkTitle} [${ev.category}]\n`;
      md += `- **Matchup:** ${ev.modelA.modelName} vs ${ev.modelB.modelName}\n`;
      md += `- **Verdict:** ${ev.verdict.winnerModelId === 'TIE' ? 'Tie' : `Winner: ${ev.verdict.winnerModelId}`}\n`;
      md += `- **Composite Delta:** ${ev.modelA.compositeScore} vs ${ev.modelB.compositeScore}\n`;
      md += `- **Judge Rationale:** ${ev.verdict.winnerReasoning}\n\n`;
    });

    return md;
  };

  // Generate CSV
  const generateCSV = () => {
    let csv = `EvaluationID,Timestamp,BenchmarkTitle,Category,ModelA,ScoreA,ModelB,ScoreB,Winner,LatencyA_ms,LatencyB_ms\n`;
    evaluations.forEach(ev => {
      csv += `"${ev.id}","${ev.timestamp}","${ev.benchmarkTitle}","${ev.category}","${ev.modelA.modelName}",${ev.modelA.compositeScore},"${ev.modelB.modelName}",${ev.modelB.compositeScore},"${ev.verdict.winnerModelId}",${ev.modelA.latencyMs},${ev.modelB.latencyMs}\n`;
    });
    return csv;
  };

  // Generate JSON
  const generateJSON = () => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        leaderboard: leaderboardData,
        evaluations
      },
      null,
      2
    );
  };

  const getExportContent = () => {
    if (exportFormat === 'html') return generateLeaderboardPortfolioHtml(leaderboardData, evaluations);
    if (exportFormat === 'markdown') return generateMarkdown();
    if (exportFormat === 'csv') return generateCSV();
    return generateJSON();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getExportContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getExportContent();
    const mimeType = exportFormat === 'html'
      ? 'text/html;charset=utf-8'
      : exportFormat === 'json'
      ? 'application/json'
      : exportFormat === 'csv'
      ? 'text/csv'
      : 'text/markdown';
    const extension = exportFormat === 'html'
      ? 'html'
      : exportFormat === 'json'
      ? 'json'
      : exportFormat === 'csv'
      ? 'csv'
      : 'md';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark_evaluation_report_${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              Export Evaluation Data & Reports
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Ready for executive summaries, GitHub portfolios, and resume presentations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Format Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase font-mono">Select Export Format:</span>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setExportFormat('html')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  exportFormat === 'html' ? 'bg-indigo-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>HTML (GitHub Webpage)</span>
              </button>
              <button
                onClick={() => setExportFormat('markdown')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  exportFormat === 'markdown' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Markdown (README)</span>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  exportFormat === 'json' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  exportFormat === 'csv' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Preview Box */}
          <div className="relative">
            <pre className="text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
              {getExportContent()}
            </pre>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            {evaluations.length} evaluation runs ready for export
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
