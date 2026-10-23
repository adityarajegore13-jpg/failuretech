"use client";

import * as React from "react";
import { TrendingUp, Layers, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DEMO_VELOCITY_DATA, VelocityDataPoint } from "@/lib/demo-data";

export function ProjectVelocityChart() {
  const [hoveredPoint, setHoveredPoint] = React.useState<VelocityDataPoint | null>(null);

  // SVG dimensions
  const width = 600;
  const height = 200;
  const paddingX = 40;
  const paddingY = 25;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const maxVal = 70;

  // Calculate coordinates
  const points = DEMO_VELOCITY_DATA.map((d, index) => {
    const x = paddingX + (index / (DEMO_VELOCITY_DATA.length - 1)) * graphWidth;
    const yPlanned = height - paddingY - (d.planned / maxVal) * graphHeight;
    const yCompleted = height - paddingY - (d.completed / maxVal) * graphHeight;
    return { ...d, x, yPlanned, yCompleted };
  });

  // SVG path generation
  const completedLinePath = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.yCompleted}`,
    ""
  );

  const completedAreaPath = `${completedLinePath} L ${points[points.length - 1].x} ${
    height - paddingY
  } L ${points[0].x} ${height - paddingY} Z`;

  const plannedLinePath = points.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.yPlanned}`,
    ""
  );

  const activeSprint = DEMO_VELOCITY_DATA.find((s) => s.sprint.includes("Active")) || points[4];

  return (
    <Card className="glass-panel border-slate-800/80 p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background ambient beam */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

      <CardHeader className="p-0 pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-base font-bold text-white">
              Sprint Velocity & Deliverable Velocity
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Story points planned vs completed across client delivery iterations
          </CardDescription>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30" />
            <span className="text-slate-300">Delivered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500 ring-2 ring-slate-600/30" />
            <span className="text-slate-400">Planned Target</span>
          </div>
          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
            93% On-Track
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4">
        {/* Interactive SVG Chart */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-48 sm:h-56 overflow-visible"
            aria-label="Sprint Velocity Line Chart"
          >
            <defs>
              <linearGradient id="velocityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Gridlines */}
            {[0, 20, 40, 60].map((val) => {
              const y = height - paddingY - (val / maxVal) * graphHeight;
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-500 text-[9px] font-mono"
                  >
                    {val} pts
                  </text>
                </g>
              );
            })}

            {/* Area gradient under completed line */}
            <path d={completedAreaPath} fill="url(#velocityFill)" />

            {/* Planned Target Line (Dashed Slate) */}
            <path
              d={plannedLinePath}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Completed Line (Glowing Cyan-Indigo) */}
            <path
              d={completedLinePath}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              filter="url(#neonGlow)"
            />

            {/* Data Point Circles */}
            {points.map((p) => {
              const isHovered = hoveredPoint?.sprint === p.sprint;
              return (
                <g
                  key={p.sprint}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible hit target for smooth hover */}
                  <circle cx={p.x} cy={p.yCompleted} r="18" fill="transparent" />

                  {/* Planned Point */}
                  <circle
                    cx={p.x}
                    cy={p.yPlanned}
                    r="3.5"
                    fill="#334155"
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />

                  {/* Completed Point */}
                  <circle
                    cx={p.x}
                    cy={p.yCompleted}
                    r={isHovered ? "6" : "4.5"}
                    fill="#090d16"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                  />

                  {/* X-Axis Labels */}
                  <text
                    x={p.x}
                    y={height - 5}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px] font-medium"
                  >
                    {p.sprint.split(" ")[1]}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Dynamic Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl text-xs z-20 animate-in fade-in duration-150">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                {hoveredPoint.sprint}
              </p>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <p className="text-cyan-400 font-medium">
                  Completed: <span className="font-mono">{hoveredPoint.completed} story points</span>
                </p>
                <p className="text-slate-400">
                  Planned: <span className="font-mono">{hoveredPoint.planned} story points</span>
                </p>
                <p className="text-emerald-400 font-medium pt-0.5 border-t border-slate-800">
                  Velocity Rate: <span className="font-mono">{hoveredPoint.velocityRate}%</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chart Summary Footnote */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>
              Active Iteration: <strong className="text-slate-200">Sprint 14</strong> (56 of 60 pts closed)
            </span>
          </div>
          <span className="text-[11px] font-mono text-indigo-400">
            Burnup Efficiency: +12% YoY
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
