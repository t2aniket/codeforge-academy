import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPrefixes = ["/auth", "/_next", "/favicon.ico"];
const protectedLearningPrefixes = ["/", "/dashboard", "/profile", "/courses", "/labs", "/playground", "/challenges", "/explore"];

export async function middleware(request: NextRequest) {
  const isPublicRoute = publicPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (isPublicRoute) return NextResponse.next();

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isProtectedLearningRoute = protectedLearningPrefixes.some((prefix) =>
    prefix === "/" ? request.nextUrl.pathname === "/" : request.nextUrl.pathname.startsWith(prefix)
  );

  if (!isAdminRoute && !isProtectedLearningRoute) return NextResponse.next();

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL === undefined ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === undefined
  ) {
    if (request.cookies.get("codeforge_demo_session")?.value === "active") return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("login", "required");
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && process.env.ALLOW_DEMO_ADMIN === "true") {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options });
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("login", "required");
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (!isAdminRoute) return response;

  const { data: adminProfile } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", data.user.id)
    .in("role", ["owner", "admin"])
    .maybeSingle();

  if (!adminProfile) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("admin", "denied");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/profile",
    "/profile/:path*",
    "/courses",
    "/courses/:path*",
    "/labs",
    "/labs/:path*",
    "/playground",
    "/challenges",
    "/challenges/:path*",
    "/explore",
    "/explore/:path*"
  ]
};
