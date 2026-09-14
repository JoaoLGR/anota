import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();
  const response = NextResponse.next({ request });
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (
        cookies: { name: string; value: string; options: CookieOptions }[],
      ) =>
        cookies.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        ),
    },
  });
  const {
    data: { user },
  } = await client.auth.getUser();
  const isInviteCallback =
    request.nextUrl.searchParams.has("code") ||
    request.nextUrl.searchParams.get("type") === "invite";
  if (!user && isInviteCallback && request.nextUrl.pathname !== "/invite") {
    const inviteUrl = new URL("/invite", request.url);
    inviteUrl.search = request.nextUrl.search;
    return NextResponse.redirect(inviteUrl);
  }
  if (!user && !["/login", "/invite"].includes(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }
  if (user && request.nextUrl.pathname === "/login")
    return NextResponse.redirect(new URL("/", request.url));
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)",
  ],
};
