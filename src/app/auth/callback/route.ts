import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Forward to requested next path or dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If error occurred or code is missing, redirect to login with error parameter
  return NextResponse.redirect(
    new URL("/login?error=Invalid+or+expired+authentication+link", requestUrl.origin)
  );
}
