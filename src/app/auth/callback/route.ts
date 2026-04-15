import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/portal/dashboard";

  // Collect cookies set during auth so we can attach to the redirect response
  const pendingCookies: Array<Parameters<typeof NextResponse.prototype.cookies.set>> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push([name, value, options]);
          });
        },
      },
    }
  );

  let success = false;

  if (token_hash && type) {
    // Handles magic link, invite, recovery, email confirmation
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "email" | "magiclink" | "email_change",
    });
    success = !error;
  } else if (code) {
    // Handles PKCE code exchange
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    success = !error;
  }

  const redirectTo = success
    ? `${origin}${next}`
    : `${origin}/portal/login?error=auth`;

  const response = NextResponse.redirect(redirectTo);

  // Attach session cookies to the redirect response
  pendingCookies.forEach((args) => response.cookies.set(...args));

  return response;
}
