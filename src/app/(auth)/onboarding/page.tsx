"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  User,
  Building2,
  Briefcase,
  Phone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Bell,
  Globe,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { completeOnboardingAction, AuthActionResult } from "@/lib/auth/actions";

function OnboardingWizard() {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [clientError, setClientError] = React.useState<string | null>(null);

  const [state, formAction, isPending] = React.useActionState<
    AuthActionResult | null,
    FormData
  >(completeOnboardingAction, null);

  const handleNext = () => {
    setClientError(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setClientError("Please enter your full name.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!companyName.trim()) {
        setClientError("Please enter your company or organization name.");
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setClientError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const displayedError = state?.error || clientError;

  return (
    <Card className="glass-panel border-slate-800/90 shadow-2xl p-6 sm:p-8">
      <CardHeader className="text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25 mb-3">
          <div className="flex h-full w-full items-center justify-center rounded-[15px] bg-[#090d16]">
            <ShieldCheck className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] text-indigo-300 mx-auto mb-2">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          <span>FailureTech Onboarding Flow</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-white">
          Welcome to FailureTech
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 mt-1">
          Complete your profile to customize your project workspace & access permissions
        </CardDescription>

        {/* Step Progression Bar */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div
            className={`h-1.5 w-16 rounded-full transition-colors ${
              step >= 1 ? "bg-indigo-500" : "bg-slate-800"
            }`}
          />
          <div
            className={`h-1.5 w-16 rounded-full transition-colors ${
              step >= 2 ? "bg-indigo-500" : "bg-slate-800"
            }`}
          />
          <div
            className={`h-1.5 w-16 rounded-full transition-colors ${
              step >= 3 ? "bg-indigo-500" : "bg-slate-800"
            }`}
          />
        </div>
        <div className="mt-1 text-[11px] font-medium text-slate-400">
          Step {step} of 3:{" "}
          {step === 1 && "Identity & Role"}
          {step === 2 && "Organization Context"}
          {step === 3 && "Preferences & Confirmation"}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayedError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
            <p className="leading-snug">{displayedError}</p>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {/* Step 1: Personal Profile */}
          {step === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Full Legal Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Marcus Vance"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Professional Title / Designation
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. VP of Product Engineering"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Direct Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="glow"
                  onClick={handleNext}
                  className="w-full text-xs font-semibold"
                >
                  <span>Continue to Organization Setup</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Organization Context */}
          {step === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">
                  Company / Organization Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    name="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="e.g. Acme Global Enterprises"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  This workspace binds your project deliverables, milestones, and billing records.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                  <Globe className="h-4 w-4" />
                  <span>Primary Portal Access Region</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Defaulting to US-East (Virginia) engineering nodes with encrypted PostgreSQL Row Level Security.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  className="w-1/3 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Back</span>
                </Button>
                <Button
                  type="button"
                  variant="glow"
                  onClick={handleNext}
                  className="w-2/3 text-xs font-semibold"
                >
                  <span>Review Preferences</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Notification & Confirmation */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Hidden Inputs carry form values to Server Action */}
              <input type="hidden" name="fullName" value={fullName} />
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="phone" value={phone} />
              <input type="hidden" name="companyName" value={companyName} />

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Onboarding Profile Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Full Name:</span>
                    <p className="text-slate-200 font-medium truncate">{fullName || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Job Title:</span>
                    <p className="text-slate-200 font-medium truncate">{title || "Stakeholder"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Organization:</span>
                    <p className="text-slate-200 font-medium truncate">{companyName || "Acme Global"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Contact Phone:</span>
                    <p className="text-slate-200 font-medium truncate">{phone || "None"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                  <Bell className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Automated Alert Channels</span>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                  />
                  <span>Email notifications for milestone approvals & invoice releases</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0"
                  />
                  <span>Deliverable feedback & sprint progress notifications</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  disabled={isPending}
                  className="w-1/3 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Back</span>
                </Button>
                <Button
                  type="submit"
                  variant="glow"
                  disabled={isPending}
                  isLoading={isPending}
                  className="w-2/3 text-xs font-semibold"
                >
                  <span>{isPending ? "Configuring Portal..." : "Enter Workspace"}</span>
                  {!isPending && <ArrowRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-slate-800/80 pt-4 text-center">
        <Link href="/dashboard" className="text-[11px] text-slate-400 hover:text-indigo-400">
          Skip for now and enter dashboard directly
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function OnboardingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          Loading onboarding flow...
        </div>
      }
    >
      <OnboardingWizard />
    </React.Suspense>
  );
}
