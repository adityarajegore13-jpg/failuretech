import { Settings, Shield, Bell, User, Key, Database, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-indigo-400" />
          Client Portal Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your organization profile, Supabase sync tokens, and notification dispatch rules.
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-400" />
              Organization & Contact Profile
            </CardTitle>
            <CardDescription>
              Details displayed to your FailureTech account manager and engineering teams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Company Name</label>
                <input
                  type="text"
                  defaultValue="Acme Global Enterprises"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Technical Contact Name</label>
                <input
                  type="text"
                  defaultValue="Marcus Vance"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Primary Contact Email</label>
                <input
                  type="email"
                  defaultValue="m.vance@acmeglobal.com"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Timezone</label>
                <input
                  type="text"
                  defaultValue="America/New_York (EST - UTC-5)"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button variant="secondary" size="sm">
                <Save className="h-3.5 w-3.5" />
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security & Supabase Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" />
              Supabase Backend Connection
            </CardTitle>
            <CardDescription>
              Project environment variables and connected database instance status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-800/40 p-4 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Database Driver:</span>
                <span className="font-mono text-emerald-400 font-semibold">Supabase PostgreSQL v16</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">App Router Adapter:</span>
                <span className="font-mono text-slate-300">@supabase/ssr (Server & Client Context)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Environment File:</span>
                <span className="font-mono text-indigo-400">.env.local (Loaded)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
