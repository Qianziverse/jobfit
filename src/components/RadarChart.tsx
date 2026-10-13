import React from 'react';

interface RadarDimension {
  label: string;
  current: number;
  required: number;
}

interface RadarChartProps {
  dimensions: RadarDimension[];
  size?: number;
}

export default function RadarChart({ dimensions, size = 200 }: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.38;
  const count = dimensions.length;

  const getPoint = (index: number, value: number): [number, number] => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = (value / 100) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const getLabelPoint = (index: number): [number, number] => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = radius + 22;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  const gridLevels = [20, 40, 60, 80, 100];

  const currentPoints = dimensions.map((d, i) => getPoint(i, d.current));
  const requiredPoints = dimensions.map((d, i) => getPoint(i, d.required));

  const toPath = (points: [number, number][]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {gridLevels.map((level) => {
        const gridPoints = dimensions.map((_, i) => getPoint(i, level));
        return (
          <polygon
            key={level}
            points={gridPoints.map((p) => `${p[0]},${p[1]}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {dimensions.map((_, i) => {
        const [x, y] = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      <path
        d={toPath(requiredPoints)}
        fill="rgba(236, 72, 153, 0.08)"
        stroke="rgba(236, 72, 153, 0.7)"
        strokeWidth="2"
      />

      <path
        d={toPath(currentPoints)}
        fill="rgba(139, 92, 246, 0.15)"
        stroke="rgba(139, 92, 246, 0.85)"
        strokeWidth="2"
        strokeDasharray="5 3"
      />

      {currentPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#8b5cf6" />
      ))}

      {dimensions.map((dim, i) => {
        const [lx, ly] = getLabelPoint(i);
        const gap = dim.required - dim.current;
        return (
          <g key={i}>
            <text
              x={lx}
              y={ly - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(148,163,184,0.9)"
              fontSize="9"
              fontWeight="500"
            >
              {dim.label}
            </text>
            {gap > 0 && (
              <text
                x={lx}
                y={ly + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(251,146,60,0.8)"
                fontSize="8"
              >
                差{gap}分
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
