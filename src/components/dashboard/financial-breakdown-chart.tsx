"use client";

import * as React from "react";
import { Receipt, DollarSign, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DEMO_CASHFLOW_DATA, FinancialDataPoint } from "@/lib/demo-data";

export function FinancialBreakdownChart() {
  const [hoveredMonth, setHoveredMonth] = React.useState<FinancialDataPoint | null>(null);

  const maxCap = 30000;

  return (
    <Card className="glass-panel border-slate-800/80 p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <CardHeader className="p-0 pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-cyan-400" />
            <CardTitle className="text-base font-bold text-white">
              Retainer Billing & Unbilled Cashflow
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-0.5">
            Billed engineering hours vs active unbilled buffer per month
          </CardDescription>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-indigo-500" />
            <span className="text-slate-300">Billed Retainer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-cyan-400" />
            <span className="text-slate-400">Unbilled In-Progress</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pt-4">
        {/* Bars Container */}
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 h-44 items-end pt-4 px-2 border-b border-slate-800">
            {DEMO_CASHFLOW_DATA.map((item) => {
              const billedHeight = (item.billed / maxCap) * 100;
              const unbilledHeight = (item.unbilled / maxCap) * 100;
              const isCurrent = item.month.includes("Current");

              return (
                <div
                  key={item.month}
                  className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredMonth(item)}
                  onMouseLeave={() => setHoveredMonth(null)}
                >
                  {/* Stacked Bar Container */}
                  <div className="relative w-full max-w-[42px] flex flex-col justify-end h-full">
                    {/* Unbilled top segment */}
                    <div
                      style={{ height: `${unbilledHeight}%` }}
                      className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 to-cyan-300 opacity-80 group-hover:opacity-100 transition-opacity"
                    />

                    {/* Billed bottom segment */}
                    <div
                      style={{ height: `${billedHeight}%` }}
                      className="w-full bg-gradient-to-t from-indigo-700 via-indigo-600 to-indigo-500 shadow-md group-hover:brightness-110 transition-all"
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`text-[10px] font-medium text-center truncate w-full ${
                      isCurrent ? "text-cyan-400 font-bold" : "text-slate-400"
                    }`}
                  >
                    {item.month.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hover Detail Panel or Default Summary */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            {hoveredMonth ? (
              <>
                <div>
                  <span className="text-[11px] text-slate-400">Selected Cycle:</span>
                  <p className="font-semibold text-white">{hoveredMonth.month}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Billed:</span>
                    <span className="text-indigo-400 font-semibold">
                      ${hoveredMonth.billed.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Unbilled:</span>
                    <span className="text-cyan-400 font-semibold">
                      ${hoveredMonth.unbilled.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Retainer:</span>
                    <span className="text-emerald-400 font-semibold">
                      ${(hoveredMonth.billed + hoveredMonth.unbilled).toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-300 font-medium">
                    Current Oct Retainer: <strong className="text-white">$18,450</strong> billed +{" "}
                    <strong className="text-cyan-400">$8,550</strong> active unbilled
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  Cap: $28,000 / month <ArrowUpRight className="h-3 w-3 text-indigo-400" />
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
