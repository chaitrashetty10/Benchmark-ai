import { EvaluationRun } from '../types/benchmark';
import { EVALUATION_DIMENSIONS } from '../data/seedBenchmarks';

export function generateEvaluationHtmlReport(evaluation: EvaluationRun): string {
  const modelA = evaluation.modelA;
  const modelB = evaluation.modelB;
  const verdict = evaluation.verdict;

  const isModelAWinner = verdict.winnerModelId === modelA.modelId || verdict.winnerModelId === 'MODEL_A';
  const isModelBWinner = verdict.winnerModelId === modelB.modelId || verdict.winnerModelId === 'MODEL_B';
  const isTie = verdict.winnerModelId === 'TIE';

  const winnerName = isTie
    ? 'Statistical Parity (Tie)'
    : isModelAWinner
    ? modelA.modelName
    : modelB.modelName;

  function escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const webSourcesHtml = (sources?: { title: string; url: string }[]) => {
    if (!sources || sources.length === 0) return '<p style="color: #94a3b8; font-style: italic; font-size: 11px;">No external web sources referenced.</p>';
    return `
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
        ${sources
          .map(
            s => `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px; text-decoration: none;">🔗 ${escapeHtml(s.title)}</a>`
          )
          .join('')}
      </div>
    `;
  };

  const dimensionRows = EVALUATION_DIMENSIONS.map(dim => {
    const scoreA = modelA.dimensionScores[dim.id] || 0;
    const scoreB = modelB.dimensionScores[dim.id] || 0;
    return `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <strong>${escapeHtml(dim.label)}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${escapeHtml(dim.description)}</span>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right; ${scoreA >= scoreB ? 'color: #059669;' : ''}">
          ${scoreA.toFixed(1)} / 10
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right; ${scoreB >= scoreA ? 'color: #059669;' : ''}">
          ${scoreB.toFixed(1)} / 10
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BenchMarkAI Report - ${escapeHtml(evaluation.benchmarkTitle)}</title>
  <style>
    :root {
      --primary: #4f46e5;
      --primary-dark: #3730a3;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-600: #475569;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
      --emerald-600: #059669;
      --emerald-50: #ecfdf5;
      --rose-600: #e11d48;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f8fafc;
      color: var(--slate-800);
      line-height: 1.6;
      padding: 32px 16px;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06);
      overflow: hidden;
    }
    header {
      background: #0f172a;
      color: #ffffff;
      padding: 32px 40px;
      border-bottom: 3px solid var(--primary);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(255,255,255,0.15);
      color: #a5b4fc;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .meta-bar {
      font-size: 13px;
      color: #94a3b8;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .content { padding: 36px 40px; }
    .verdict-box {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 24px 28px;
      border-radius: 12px;
      margin-bottom: 32px;
    }
    .verdict-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #facc15;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .verdict-winner {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .verdict-desc { font-size: 14px; color: #e2e8f0; margin-bottom: 16px; }
    .cot-box {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 14px 18px;
      border-radius: 8px;
      font-size: 13px;
      color: #cbd5e1;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--slate-900);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .prompt-box {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 10px;
      padding: 18px;
      font-size: 13px;
      white-space: pre-wrap;
      margin-bottom: 32px;
      color: var(--slate-800);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 36px;
    }
    th {
      background: var(--slate-100);
      color: var(--slate-600);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 12px 16px;
      text-align: left;
      border-bottom: 2px solid var(--slate-200);
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    @media (max-width: 768px) {
      .comparison-grid { grid-template-columns: 1fr; }
      .content { padding: 24px 20px; }
      header { padding: 24px 20px; }
    }
    .candidate-card {
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      overflow: hidden;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }
    .candidate-header {
      padding: 16px 20px;
      background: var(--slate-50);
      border-bottom: 1px solid var(--slate-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .candidate-name { font-size: 15px; font-weight: 700; color: var(--slate-900); }
    .candidate-score { font-size: 18px; font-weight: 800; color: var(--primary); font-family: monospace; }
    .candidate-body { padding: 20px; flex: 1; }
    .candidate-meta { font-size: 11px; color: var(--slate-600); font-family: monospace; margin-top: 4px; }
    .response-text {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 8px;
      padding: 16px;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: pre-wrap;
      max-height: 480px;
      overflow-y: auto;
      color: var(--slate-800);
      line-height: 1.5;
    }
    footer {
      background: var(--slate-50);
      padding: 20px 40px;
      border-top: 1px solid var(--slate-200);
      font-size: 12px;
      color: var(--slate-600);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .print-btn {
      background: var(--primary);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
    }
    .print-btn:hover { background: var(--primary-dark); }
    @media print {
      body { background: #fff; padding: 0; }
      .container { border: none; box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">Multi-Model LLM Benchmark Harness Report</div>
      <h1>${escapeHtml(evaluation.benchmarkTitle)}</h1>
      <div class="meta-bar">
        <span><strong>Category:</strong> ${escapeHtml(evaluation.category)}</span>
        <span>·</span>
        <span><strong>Timestamp:</strong> ${escapeHtml(new Date(evaluation.timestamp).toUTCString())}</span>
        <span>·</span>
        <span><strong>Evaluator:</strong> Gemini 3.8 Flash (LLM-as-Judge)</span>
      </div>
    </header>

    <div class="content">
      <!-- Verdict Card -->
      <div class="verdict-box">
        <div class="verdict-title">Automated LLM-as-Judge Evaluation</div>
        <div class="verdict-winner">Winner: ${escapeHtml(winnerName)}</div>
        <div class="verdict-desc">${escapeHtml(verdict.winnerReasoning)}</div>
        <div class="cot-box">
          <strong>Chain-of-Thought Rationale:</strong><br>
          ${escapeHtml(verdict.coTRationale)}
        </div>
      </div>

      <!-- Prompt Section -->
      <div class="section-title">Standardized Benchmark Prompt</div>
      <div class="prompt-box">${escapeHtml(evaluation.prompt)}</div>

      <!-- Dimension Breakdown Table -->
      <div class="section-title">5-Dimensional Rubric Score Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Evaluation Dimension</th>
            <th style="text-align: right;">${escapeHtml(modelA.modelName)}</th>
            <th style="text-align: right;">${escapeHtml(modelB.modelName)}</th>
          </tr>
        </thead>
        <tbody>
          ${dimensionRows}
          <tr style="background: var(--slate-50); font-weight: 800;">
            <td style="padding: 12px 16px;">Composite Score (0 - 100)</td>
            <td style="padding: 12px 16px; font-family: monospace; font-weight: 800; text-align: right; ${modelA.compositeScore >= modelB.compositeScore ? 'color: #059669;' : ''}">
              ${modelA.compositeScore.toFixed(1)}
            </td>
            <td style="padding: 12px 16px; font-family: monospace; font-weight: 800; text-align: right; ${modelB.compositeScore >= modelA.compositeScore ? 'color: #059669;' : ''}">
              ${modelB.compositeScore.toFixed(1)}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Side-by-Side Model Comparison -->
      <div class="section-title">Candidate Responses & Web Grounding</div>
      <div class="comparison-grid">
        <!-- Model A -->
        <div class="candidate-card">
          <div class="candidate-header">
            <div>
              <div class="candidate-name">${escapeHtml(modelA.modelName)}</div>
              <div class="candidate-meta">${modelA.latencyMs} ms · ${modelA.tokensOutput} tokens · ${modelA.tokensPerSec} t/s</div>
            </div>
            <div class="candidate-score">${modelA.compositeScore}</div>
          </div>
          <div class="candidate-body">
            ${webSourcesHtml(modelA.groundingSources)}
            <div class="response-text">${escapeHtml(modelA.response)}</div>
          </div>
        </div>

        <!-- Model B -->
        <div class="candidate-card">
          <div class="candidate-header">
            <div>
              <div class="candidate-name">${escapeHtml(modelB.modelName)}</div>
              <div class="candidate-meta">${modelB.latencyMs} ms · ${modelB.tokensOutput} tokens · ${modelB.tokensPerSec} t/s</div>
            </div>
            <div class="candidate-score">${modelB.compositeScore}</div>
          </div>
          <div class="candidate-body">
            ${webSourcesHtml(modelB.groundingSources)}
            <div class="response-text">${escapeHtml(modelB.response)}</div>
          </div>
        </div>
      </div>
    </div>

    <footer>
      <div>Generated by <strong>BenchMarkAI</strong> — Enterprise Multi-Model Benchmark Harness</div>
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </footer>
  </div>
</body>
</html>`;
}

export function generateLeaderboardPortfolioHtml(
  leaderboardData: any[],
  evaluations: EvaluationRun[]
): string {
  function escape(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const leaderRows = leaderboardData.map((row, idx) => `
    <tr>
      <td style="padding: 12px 16px; font-weight: 800; font-family: monospace; color: #4f46e5;">#${idx + 1}</td>
      <td style="padding: 12px 16px; font-weight: 700; color: #0f172a;">${escape(row.modelName)}</td>
      <td style="padding: 12px 16px; font-family: monospace; font-weight: 800; text-align: right; color: #059669;">${row.elo}</td>
      <td style="padding: 12px 16px; text-align: center; font-family: monospace; color: #475569;">${row.wins}W - ${row.losses}L - ${row.ties}T</td>
      <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #0f172a;">${row.winRate.toFixed(1)}%</td>
      <td style="padding: 12px 16px; text-align: right; font-family: monospace; font-weight: 800; color: #4f46e5;">${row.avgCompositeScore.toFixed(1)}/100</td>
      <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: #64748b;">${row.avgLatencyMs} ms</td>
      <td style="padding: 12px 16px; text-align: right; font-family: monospace; color: #64748b;">${row.avgTokensPerSec.toFixed(0)} t/s</td>
    </tr>
  `).join('');

  const evalCards = evaluations.map((ev, idx) => `
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 11px; font-weight: 800; font-family: monospace; text-transform: uppercase; background: #ede9fe; color: #6d28d9; padding: 3px 8px; border-radius: 9999px;">
          Match ${idx + 1} · ${escape(ev.category)}
        </span>
        <span style="font-size: 11px; color: #64748b; font-family: monospace;">${escape(new Date(ev.timestamp).toLocaleDateString())}</span>
      </div>
      <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">${escape(ev.benchmarkTitle)}</h3>
      <p style="font-size: 12px; color: #475569; margin-bottom: 12px;"><strong>Prompt:</strong> ${escape(ev.prompt.slice(0, 160))}${ev.prompt.length > 160 ? '...' : ''}</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; border: 1px solid #e2e8f0;">
        <div>
          <strong>${escape(ev.modelA.modelName)}:</strong> <span style="font-family: monospace; font-weight: 700; color: #4f46e5;">${ev.modelA.compositeScore}</span>
        </div>
        <div>
          <strong>${escape(ev.modelB.modelName)}:</strong> <span style="font-family: monospace; font-weight: 700; color: #4f46e5;">${ev.modelB.compositeScore}</span>
        </div>
      </div>
      <div style="margin-top: 10px; font-size: 12px; color: #059669; font-weight: 600;">
        Verdict: ${ev.verdict.winnerModelId === 'TIE' ? 'Tie' : `Winner: ${escape(ev.verdict.winnerModelId === ev.modelA.modelId ? ev.modelA.modelName : ev.modelB.modelName)}`}
      </div>
      <p style="font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.4;">${escape(ev.verdict.winnerReasoning)}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BenchMarkAI — Enterprise LLM Evaluation Portfolio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.5; padding: 32px 16px; }
    .container { max-width: 1100px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; }
    header { background: #0f172a; color: #ffffff; padding: 36px 40px; border-bottom: 4px solid #4f46e5; }
    .badge { display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; background: rgba(99,102,241,0.25); color: #a5b4fc; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 6px; }
    .subtitle { color: #94a3b8; font-size: 14px; max-width: 720px; }
    .content { padding: 36px 40px; }
    .section-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 28px 0 16px 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: 800; padding: 12px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    footer { background: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
    .print-btn { background: #4f46e5; color: #ffffff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; }
    @media print { body { background: #fff; padding: 0; } .container { border: none; box-shadow: none; } .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">AI Systems & LLM Evaluation Portfolio</div>
      <h1>BenchMarkAI — Model Evaluation & Arena Leaderboard</h1>
      <p class="subtitle">Standardized multi-model benchmarking harness with automated LLM-as-Judge scoring, Elo ranking, position-bias mitigation, and live web research grounding.</p>
    </header>

    <div class="content">
      <div class="section-title">Current Model Leaderboard (Elo Ratings & Unit Economics)</div>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Model Configuration</th>
            <th style="text-align: right;">Elo Rating</th>
            <th style="text-align: center;">Record (W-L-T)</th>
            <th style="text-align: right;">Win Rate</th>
            <th style="text-align: right;">Composite Score</th>
            <th style="text-align: right;">p95 Latency</th>
            <th style="text-align: right;">Generation Speed</th>
          </tr>
        </thead>
        <tbody>
          ${leaderRows}
        </tbody>
      </table>

      <div class="section-title">Standardized Benchmark Match Records (${evaluations.length} Evaluated Trials)</div>
      <div>
        ${evalCards}
      </div>
    </div>

    <footer>
      <div>Generated by <strong>BenchMarkAI</strong> — AI Product Evaluation & Governance Suite</div>
      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
    </footer>
  </div>
</body>
</html>`;
}
