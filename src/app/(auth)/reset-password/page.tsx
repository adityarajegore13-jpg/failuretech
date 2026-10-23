"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resetPasswordAction, AuthActionResult } from "@/lib/auth/actions";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = React.useActionState<AuthActionResult | null, FormData>(
    resetPasswordAction,
    null
  );

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [clientError, setClientError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);
    if (password.length < 8) {
      e.preventDefault();
      setClientError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      e.preventDefault();
      setClientError("Passwords do not match.");
      return;
    }
  };

  const displayedError = state?.error || clientError;

  return (
    <Card className="glass-panel border-slate-800/90 shadow-2xl p-6 sm:p-8">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25 mb-3">
          <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#090d16]">
            <Lock className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Create New Password
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 mt-1">
          Set a secure key for your FailureTech Portal account
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayedError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-snug">{displayedError}</p>
          </div>
        )}

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">New Password (min 8 characters)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="glow"
              disabled={isPending}
              isLoading={isPending}
              className="w-full text-xs font-semibold"
            >
              <span>{isPending ? "Updating Password..." : "Save New Password"}</span>
              {!isPending && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-slate-800/80 pt-4 text-center">
        <Link href="/login" className="text-[11px] text-slate-400 hover:text-indigo-400">
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
