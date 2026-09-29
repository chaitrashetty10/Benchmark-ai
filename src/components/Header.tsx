import React from 'react';
import { Play, BookOpen, Download } from 'lucide-react';

export type ActiveTab = 'leaderboard' | 'arena' | 'runner' | 'web-compare' | 'catalog' | 'matrix';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenMethodology: () => void;
  onOpenExport: () => void;
  onOpenRunner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenMethodology,
  onOpenExport,
  onOpenRunner,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onTabChange('leaderboard')}
          className="text-lg font-bold tracking-tight text-slate-900 font-display hover:text-indigo-600 transition-colors whitespace-nowrap"
        >
          BenchMarkAI
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('leaderboard')}
            className={`transition-colors whitespace-nowrap pb-0.5 border-b-2 ${
              activeTab === 'leaderboard'
                ? 'border-indigo-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => onTabChange('web-compare')}
            className={`transition-colors whitespace-nowrap pb-0.5 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'web-compare'
                ? 'border-emerald-600 text-slate-900 font-semibold'
                : 'border-transparent text-emerald-700 hover:text-emerald-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Web Search & Compare</span>
          </button>
          <button
            onClick={() => onTabChange('arena')}
            className={`transition-colors whitespace-nowrap pb-0.5 border-b-2 ${
              activeTab === 'arena'
                ? 'border-indigo-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Arena Inspector
          </button>
          <button
            onClick={() => onTabChange('runner')}
            className={`transition-colors whitespace-nowrap pb-0.5 border-b-2 ${
              activeTab === 'runner'
                ? 'border-indigo-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Benchmark Studio
          </button>
          <button
            onClick={() => onTabChange('catalog')}
            className={`transition-colors whitespace-nowrap pb-0.5 border-b-2 ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Test Suites
          </button>
          <button
            onClick={() => onTabChange('matrix')}
            className={`transition-colors whitespace-nowrap pb-0.5 border-b-2 ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Elo Matrix
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMethodology}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            title="Evaluation Methodology & Rubric Architecture"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Methodology</span>
          </button>

          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
            title="Export Benchmark Data"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onOpenRunner}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Benchmark</span>
          </button>
        </div>
      </div>
    </header>
  );
};
