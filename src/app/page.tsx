import Link from "next/link";
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Lock,
  Code2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 antialiased flex flex-col justify-between cyber-grid relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 h-[450px] w-[450px] rounded-full bg-cyan-600/15 blur-[160px]" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-[#090d16]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#090d16]">
                <ShieldAlert className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5 text-base">
                Failure<span className="text-indigo-400">Tech</span>
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 text-[10px] font-mono text-indigo-300 border border-indigo-500/20">
                  PORTAL
                </span>
              </span>
              <p className="text-[10px] text-slate-400">Enterprise Agency Client Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Client Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="glow" size="sm" className="text-xs font-semibold">
                <span>Enter Portal</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>Major Project • Step 1 Architecture Initialized</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Engineered Transparency. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Agency Delivery, Perfected.
          </span>
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The <strong>FailureTech Agency Client Portal</strong> bridges client leadership with
          real-time engineering metrics, milestone pipelines, urgent escalation desks,
          and transparent retainer billing.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="glow" size="lg" className="font-semibold text-sm">
              <span>Launch Live Dashboard</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg" className="text-sm">
              <span>View Auth Screen</span>
            </Button>
          </Link>
        </div>

        {/* Project Architecture Grid for College Project Review */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <Card className="glass-card">
            <div className="flex items-center gap-2.5 text-indigo-400 mb-2">
              <Layers className="h-5 w-5" />
              <h3 className="font-semibold text-sm text-white">Next.js 16 App Router</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Turbopack-powered SSR with clean route groups `(dashboard)` and `(auth)`, modular layouts, and metadata SEO.
            </p>
          </Card>

          <Card className="glass-card">
            <div className="flex items-center gap-2.5 text-cyan-400 mb-2">
              <Database className="h-5 w-5" />
              <h3 className="font-semibold text-sm text-white">Supabase SSR Ready</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pre-configured server, browser, and middleware clients with full TypeScript table schemas and session refresh.
            </p>
          </Card>

          <Card className="glass-card">
            <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
              <Code2 className="h-5 w-5" />
              <h3 className="font-semibold text-sm text-white">Modern Dark System</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Agency-tier aesthetic with Tailwind CSS, custom glassmorphism, responsive sidebar shell, and atomic UI tokens.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#090d16]/80 py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-[11px]">
            FailureTech Agency Client Portal © 2026 • College Major Project
          </span>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/projects" className="hover:text-white transition-colors">
              Projects
            </Link>
            <Link href="/tickets" className="hover:text-white transition-colors">
              Tickets
            </Link>
            <Link href="/invoices" className="hover:text-white transition-colors">
              Billing
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
