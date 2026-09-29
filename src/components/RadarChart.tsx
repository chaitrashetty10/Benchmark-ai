import React from 'react';
import { EVALUATION_DIMENSIONS } from '../data/seedBenchmarks';
import { EvaluationDimension } from '../types/benchmark';

interface RadarDataPoint {
  modelId: string;
  modelName: string;
  color: string;
  scores: Record<EvaluationDimension, number>;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 380 }) => {
  const center = size / 2;
  const radius = size * 0.38;
  const numDimensions = EVALUATION_DIMENSIONS.length;
  const angleStep = (Math.PI * 2) / numDimensions;

  // Calculate coordinates for a given dimension index and score (1 to 10)
  const getCoordinates = (index: number, score: number) => {
    const normalizedScore = Math.max(0, Math.min(10, score)) / 10;
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * normalizedScore * Math.cos(angle);
    const y = center + radius * normalizedScore * Math.sin(angle);
    return { x, y };
  };

  // Generate web rings for 2, 4, 6, 8, 10
  const rings = [2, 4, 6, 8, 10];

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible select-none">
        {/* Background circular / polygon grid rings */}
        {rings.map((ringValue) => {
          const points = EVALUATION_DIMENSIONS.map((_, i) => {
            const { x, y } = getCoordinates(i, ringValue);
            return `${x},${y}`;
          }).join(' ');

          return (
            <g key={`ring-${ringValue}`}>
              <polygon
                points={points}
                fill={ringValue === 10 ? '#F8FAFC' : 'none'}
                stroke="#E2E8F0"
                strokeWidth={ringValue === 10 ? '1.5' : '1'}
                strokeDasharray={ringValue === 10 ? undefined : '3 3'}
              />
              <text
                x={center}
                y={center - (radius * (ringValue / 10)) + 4}
                className="text-[9px] fill-slate-400 font-mono font-medium text-center"
                textAnchor="middle"
              >
                {ringValue}
              </text>
            </g>
          );
        })}

        {/* Axis lines from center to outer ring */}
        {EVALUATION_DIMENSIONS.map((_, i) => {
          const { x, y } = getCoordinates(i, 10);
          return (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          );
        })}

        {/* Polygons for each model's scores */}
        {data.map((item) => {
          const points = EVALUATION_DIMENSIONS.map((dim, i) => {
            const score = item.scores[dim.id] || 0;
            const { x, y } = getCoordinates(i, score);
            return `${x},${y}`;
          }).join(' ');

          return (
            <g key={item.modelId} className="transition-all duration-300">
              <polygon
                points={points}
                fill={item.color}
                fillOpacity="0.18"
                stroke={item.color}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Vertex dots */}
              {EVALUATION_DIMENSIONS.map((dim, i) => {
                const score = item.scores[dim.id] || 0;
                const { x, y } = getCoordinates(i, score);
                return (
                  <circle
                    key={`dot-${item.modelId}-${dim.id}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={item.color}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Axis Labels */}
        {EVALUATION_DIMENSIONS.map((dim, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelDist = radius + 28;
          const x = center + labelDist * Math.cos(angle);
          const y = center + labelDist * Math.sin(angle);

          return (
            <g key={`label-${dim.id}`}>
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[11px] font-semibold fill-slate-700 font-sans tracking-tight"
              >
                {dim.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
        {data.map((item) => (
          <div key={`legend-${item.modelId}`} className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.modelName}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
