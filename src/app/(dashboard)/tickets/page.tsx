import { LifeBuoy, Plus, Search, Filter, MessageSquare, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TicketsPage() {
  const tickets = [
    {
      id: "FT-TKT-104",
      title: "Add webhook listener for Stripe payment failure retries",
      project: "Fintech Core Banking API",
      priority: "high" as const,
      priorityVariant: "danger" as const,
      status: "open" as const,
      statusVariant: "warning" as const,
      statusLabel: "In Progress",
      assignedTo: "Elena Rostova",
      updatedAt: "25 mins ago",
      responsesCount: 4,
    },
    {
      id: "FT-TKT-103",
      title: "Export filtered analytics reports into encrypted CSV / PDF",
      project: "High-Frequency Algorithmic Analytics",
      priority: "medium" as const,
      priorityVariant: "warning" as const,
      status: "in_progress" as const,
      statusVariant: "info" as const,
      statusLabel: "Assigned",
      assignedTo: "Devon Reed",
      updatedAt: "2 hours ago",
      responsesCount: 2,
    },
    {
      id: "FT-TKT-102",
      title: "Implement rate-limiting headers for public developer sandbox",
      project: "Fintech Core Banking API",
      priority: "urgent" as const,
      priorityVariant: "danger" as const,
      status: "resolved" as const,
      statusVariant: "success" as const,
      statusLabel: "Resolved",
      assignedTo: "Alex Chen",
      updatedAt: "Yesterday",
      responsesCount: 7,
    },
    {
      id: "FT-TKT-101",
      title: "Update DNS CAA records and renew wildcard SSL certificate",
      project: "Zero-Trust Infrastructure",
      priority: "low" as const,
      priorityVariant: "default" as const,
      status: "resolved" as const,
      statusVariant: "success" as const,
      statusLabel: "Resolved",
      assignedTo: "DevOps Team",
      updatedAt: "3 days ago",
      responsesCount: 1,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <LifeBuoy className="h-6 w-6 text-indigo-400" />
            Support & Feature Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Direct high-priority communication channel to FailureTech engineering leads.
          </p>
        </div>

        <Button variant="glow" size="sm">
          <Plus className="h-4 w-4" />
          <span>Submit Urgent Ticket</span>
        </Button>
      </div>

      {/* Ticket Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by ID or title..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="secondary" size="sm" className="text-xs">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter Priority</span>
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            Status: All
          </Button>
        </div>
      </div>

      {/* Tickets List */}
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-800/80">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 hover:bg-slate-800/30 transition-colors gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-indigo-400">
                    {ticket.id}
                  </span>
                  <Badge variant={ticket.priorityVariant}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-400">• {ticket.project}</span>
                </div>

                <h3 className="text-sm font-semibold text-white hover:text-indigo-300 cursor-pointer transition-colors">
                  {ticket.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                  <span>Assigned: {ticket.assignedTo}</span>
                  <span>Updated: {ticket.updatedAt}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-slate-400" />
                    {ticket.responsesCount} responses
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0">
                <Badge variant={ticket.statusVariant} dot>
                  {ticket.statusLabel}
                </Badge>
                <Button variant="secondary" size="sm" className="text-xs h-8">
                  Open Thread
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
