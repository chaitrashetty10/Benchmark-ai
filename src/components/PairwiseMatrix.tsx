import React from 'react';
import { ModelProfile, EvaluationRun } from '../types/benchmark';

interface PairwiseMatrixProps {
  models: ModelProfile[];
  evaluations: EvaluationRun[];
  onSelectPair: (modelAId: string, modelBId: string) => void;
}

export const PairwiseMatrix: React.FC<PairwiseMatrixProps> = ({
  models,
  evaluations,
  onSelectPair
}) => {
  // Calculate win rate of row model vs column model
  const getPairStats = (modelRowId: string, modelColId: string) => {
    if (modelRowId === modelColId) return null;

    let wins = 0;
    let losses = 0;
    let ties = 0;

    evaluations.forEach(ev => {
      const isMatch =
        (ev.modelA.modelId === modelRowId && ev.modelB.modelId === modelColId) ||
        (ev.modelA.modelId === modelColId && ev.modelB.modelId === modelRowId);

      if (isMatch) {
        const winner = ev.verdict.winnerModelId;
        if (winner === 'TIE') {
          ties++;
        } else if (winner === modelRowId || (winner === 'MODEL_A' && ev.modelA.modelId === modelRowId) || (winner === 'MODEL_B' && ev.modelB.modelId === modelRowId)) {
          wins++;
        } else {
          losses++;
        }
      }
    });

    const total = wins + losses + ties;
    const winRate = total > 0 ? (wins + 0.5 * ties) / total : 0.5;

    return {
      wins,
      losses,
      ties,
      total,
      winRate: Math.round(winRate * 100)
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Pairwise Head-to-Head Win Rate Matrix
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            LMSYS-style head-to-head empirical win fractions between model pairings. Rows represent candidate models and columns represent opponents.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          <span>Row Model Win Fraction vs Column Model</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto p-6">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left font-bold text-xs uppercase font-mono text-slate-500 border-b border-slate-200 w-56">
                Model (Row vs Col)
              </th>
              {models.map(colModel => (
                <th
                  key={colModel.id}
                  className="p-3 text-xs font-semibold text-slate-800 border-b border-slate-200 max-w-[140px]"
                >
                  <div className="truncate font-sans">{colModel.name.split(' ')[0]} {colModel.name.split(' ')[1] || ''}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map(rowModel => (
              <tr key={rowModel.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="p-3 text-left font-semibold text-sm text-slate-900 flex flex-col justify-center">
                  <span>{rowModel.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono font-normal">
                    {rowModel.id}
                  </span>
                </td>

                {models.map(colModel => {
                  const stats = getPairStats(rowModel.id, colModel.id);

                  if (rowModel.id === colModel.id) {
                    return (
                      <td key={colModel.id} className="p-3 bg-slate-100/60 text-slate-400 text-xs font-mono">
                        —
                      </td>
                    );
                  }

                  if (!stats || stats.total === 0) {
                    return (
                      <td
                        key={colModel.id}
                        onClick={() => onSelectPair(rowModel.id, colModel.id)}
                        className="p-3 text-xs text-slate-400 font-mono hover:bg-indigo-50/40 cursor-pointer"
                        title="Click to execute this matchup in Studio"
                      >
                        <span className="text-slate-400">No data</span>
                        <div className="text-[10px] text-indigo-500 mt-0.5">Run test</div>
                      </td>
                    );
                  }

                  // Color gradient based on win rate (Green for >50%, Red for <50%)
                  const isHigh = stats.winRate >= 60;
                  const isMid = stats.winRate >= 45 && stats.winRate < 60;
                  const bgClass = isHigh
                    ? 'bg-emerald-50 text-emerald-800'
                    : isMid
                    ? 'bg-slate-50 text-slate-800'
                    : 'bg-rose-50 text-rose-800';

                  return (
                    <td
                      key={colModel.id}
                      onClick={() => onSelectPair(rowModel.id, colModel.id)}
                      className={`p-3 cursor-pointer transition-colors hover:ring-2 hover:ring-indigo-400 ${bgClass}`}
                      title={`Click to test ${rowModel.name} vs ${colModel.name}`}
                    >
                      <div className="font-mono font-bold text-sm tabular-nums">
                        {stats.winRate}%
                      </div>
                      <div className="text-[10px] opacity-75 font-mono">
                        {stats.wins}W - {stats.losses}L ({stats.total} runs)
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
              <span>Win Rate &gt; 60%</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
              <span>Parity (45% - 59%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300" />
              <span>Win Rate &lt; 45%</span>
            </span>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Click any cell to trigger a live head-to-head evaluation
          </div>
        </div>
      </div>
    </div>
  );
};
