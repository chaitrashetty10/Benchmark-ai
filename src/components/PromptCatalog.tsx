import React, { useState } from 'react';
import { BenchmarkPrompt } from '../types/benchmark';
import { Play, CheckCircle2, Tag, Search, Filter } from 'lucide-react';

interface PromptCatalogProps {
  benchmarks: BenchmarkPrompt[];
  onLoadInStudio: (benchmarkId: string) => void;
}

export const PromptCatalog: React.FC<PromptCatalogProps> = ({
  benchmarks,
  onLoadInStudio
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Product Reasoning',
    'Technical Feasibility',
    'Completeness & Rigor',
    'Relevance & Precision',
    'AI Alignment & Safety'
  ];

  const filteredBenchmarks = benchmarks.filter(b => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesQuery = !searchQuery.trim() || 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-display">
            Standardized Benchmark Suite Catalog
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Curated evaluation prompts grounded in enterprise production constraints, high-concurrency invariants, edge cases, and safety checks.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          <span>{benchmarks.length} Standardized Prompts Loaded</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search benchmarks by keyword, topic, or system constraint..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Pills/Buttons as segmented tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBenchmarks.map(bm => (
          <div
            key={bm.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-indigo-700">{bm.category}</span>
                <span className={`font-mono px-2 py-0.5 rounded text-[11px] ${
                  bm.difficulty === 'Hardcore'
                    ? 'bg-rose-50 text-rose-700'
                    : bm.difficulty === 'Advanced'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {bm.difficulty}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900">
                {bm.title}
              </h2>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {bm.prompt}
              </p>

              {/* Ground Truth Criteria Preview */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                  Key Evaluation Criteria ({bm.groundTruthCriteria.length})
                </span>
                <ul className="text-xs text-slate-600 space-y-1">
                  {bm.groundTruthCriteria.slice(0, 3).map((crit, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{crit}</span>
                    </li>
                  ))}
                  {bm.groundTruthCriteria.length > 3 && (
                    <li className="text-[11px] text-slate-400 pl-5">
                      +{bm.groundTruthCriteria.length - 3} more criteria checkpoints
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Bottom Meta & Load Button */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                {bm.tags.map((tag, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mr-1.5">·</span>}
                    #{tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onLoadInStudio(bm.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test in Studio</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
