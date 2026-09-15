import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const sessionOnly = [
    "/api/media",
    "/api/upload",
    "/api/users",
    "/api/roles",
    "/api/admin/audit",
    "/api/admin/mfa",
    "/api/admin/backups",
    "/api/admin/series",
    "/api/admin/ai",
    "/api/admin/newsletter",
    "/api/admin/analytics",
    "/api/admin/comments",
  ];
  if (sessionOnly.some((prefix) => pathname.startsWith(prefix))) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Protect API write routes
  if (
    ["/api/posts", "/api/categories"].some((prefix) =>
      pathname.startsWith(prefix)
    ) &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  ) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/posts/:path*",
    "/api/categories/:path*",
    "/api/media/:path*",
    "/api/upload/:path*",
    "/api/users/:path*",
    "/api/roles/:path*",
    "/api/admin/:path*",
  ],
};