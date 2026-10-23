"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, ArrowRight, Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { forgotPasswordAction, AuthActionResult } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = React.useActionState<AuthActionResult | null, FormData>(
    forgotPasswordAction,
    null
  );

  return (
    <Card className="glass-panel border-slate-800/90 shadow-2xl p-6 sm:p-8">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25 mb-3">
          <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#090d16]">
            <KeyRound className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Reset Portal Access
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 mt-1">
          Enter your authorized account email to receive a recovery token
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state?.error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-snug">{state.error}</p>
          </div>
        )}

        {state?.success && state?.message ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <p className="leading-relaxed">{state.message}</p>
            </div>
            <Link href="/login" className="block">
              <Button variant="secondary" className="w-full text-xs">
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                <span>Return to Login</span>
              </Button>
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Authorized Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@company.com"
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
                <span>{isPending ? "Sending Reset Link..." : "Dispatch Reset Link"}</span>
                {!isPending && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-slate-800/80 pt-4 text-center">
        <Link
          href="/login"
          className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Remembered credentials? Sign in</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
