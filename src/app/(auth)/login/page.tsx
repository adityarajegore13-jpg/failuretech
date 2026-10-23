"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loginAction, AuthActionResult } from "@/lib/auth/actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "";
  const errorParam = searchParams.get("error");
  const noticeParam = searchParams.get("notice");

  const [state, formAction, isPending] = React.useActionState<AuthActionResult | null, FormData>(
    loginAction,
    null
  );

  const [showPassword, setShowPassword] = React.useState(false);
  const [emailInput, setEmailInput] = React.useState("m.vance@acmeglobal.com");
  const [passwordInput, setPasswordInput] = React.useState("password123");
  const [clientError, setClientError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);
    if (!emailInput.trim()) {
      e.preventDefault();
      setClientError("Please enter your email address.");
      return;
    }
    if (!passwordInput) {
      e.preventDefault();
      setClientError("Please enter your password.");
      return;
    }
  };

  const displayedError = state?.error || clientError || errorParam;

  return (
    <Card className="glass-panel border-slate-800/90 shadow-2xl p-6 sm:p-8">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25 mb-3">
          <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#090d16]">
            <ShieldAlert className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Failure<span className="text-indigo-400">Tech</span> Portal
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 mt-1">
          Authorized Client & Engineering Partner Access
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert Banner */}
        {displayedError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-snug">{displayedError}</p>
          </div>
        )}

        {/* Notice Alert Banner */}
        {noticeParam === "password_updated" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <p className="leading-snug">
              Your password has been successfully updated. Please sign in with your new credentials.
            </p>
          </div>
        )}

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="next" value={nextParam} />

          {/* Work Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                name="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@company.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-10 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="glow"
              disabled={isPending}
              isLoading={isPending}
              className="w-full text-xs font-semibold"
            >
              <span>{isPending ? "Authenticating..." : "Sign In to Client Portal"}</span>
              {!isPending && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0f172a] px-2 text-slate-400">
              New Client Organization?
            </span>
          </div>
        </div>

        {/* Link to Register New Organization */}
        <Link href="/signup" className="block">
          <Button variant="secondary" className="w-full text-xs">
            Register New Client Organization
          </Button>
        </Link>
      </CardContent>

      <CardFooter className="flex-col gap-2 justify-center border-t border-slate-800/80 pt-4 text-center">
        <p className="text-[11px] text-slate-400">
          Have an agency invitation link?{" "}
          <Link href="/accept-invitation" className="text-indigo-400 hover:underline">
            Accept Invitation
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Loading authentication gateway...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
