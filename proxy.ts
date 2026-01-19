import {
  buildOrgRedirectUrl,
  extractOrgSlug,
  findUserOrganization,
  getFirstUserOrganization,
  handleRootRedirect,
  isAdminRoute,
  isReservedSlug,
  redirectToOrgList,
  redirectToRoot,
  validateAdminAccess,
  validateSession,
} from "@/lib/auth/proxy-utils";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function extractApiOrgSlug(pathname: string): string | null {
  const match = pathname.match(/^\/api\/orgs\/([^/]+)/);
  return match ? match[1] : null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/orgs/")) {
    const slug = extractApiOrgSlug(pathname);
    if (slug) {
      const response = NextResponse.next();
      response.headers.set("x-org-slug", slug);
      return response;
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return handleRootRedirect(request) ?? NextResponse.next();
  }

  if (isAdminRoute(pathname)) {
    const adminUser = await validateAdminAccess(request);
    if (!adminUser) {
      return redirectToRoot(request);
    }
    return NextResponse.next();
  }

  const slug = extractOrgSlug(pathname);
  if (!slug) return NextResponse.next();

  if (isReservedSlug(slug)) {
    return NextResponse.next();
  }

  const session = await validateSession(request);
  if (!session) return NextResponse.next();

  if (slug === "default") {
    const firstOrg = await getFirstUserOrganization(session.session.userId);
    if (firstOrg?.slug) {
      return buildOrgRedirectUrl(request, firstOrg.slug);
    }
    return redirectToOrgList(request);
  }

  const org = await findUserOrganization(slug, session.session.userId);

  if (!org) {
    return redirectToOrgList(request);
  }

  if (org.slug && slug !== org.slug) {
    return buildOrgRedirectUrl(request, org.slug);
  }

  const response = NextResponse.next();
  response.headers.set("x-org-slug", org.slug ?? slug);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    "/api/orgs/:path*",
  ],
};
