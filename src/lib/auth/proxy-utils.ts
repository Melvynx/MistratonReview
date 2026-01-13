import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { RESERVED_SLUGS } from "@/lib/organizations/reserved-slugs";
import { prisma } from "@/lib/prisma";
import { redisClient } from "@/lib/redis";
import { CacheKeys, CacheTTL } from "@/lib/redis-keys";
import { SiteConfig } from "@/site-config";
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const handleRootRedirect = (request: NextRequest) => {
  if (!SiteConfig.features.enableLandingRedirection) return null;

  const session = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  if (!session) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/orgs";
  return NextResponse.redirect(url);
};

export const extractOrgSlug = (pathname: string) => {
  if (!pathname.startsWith("/orgs/")) return null;

  const slugStartIndex = "/orgs/".length;
  const slashIndex = pathname.indexOf("/", slugStartIndex);
  const slug =
    slashIndex === -1
      ? pathname.substring(slugStartIndex)
      : pathname.substring(slugStartIndex, slashIndex);

  const isValidSlug = slug && slug !== "" && pathname !== "/orgs";
  return isValidSlug ? slug : null;
};

export const validateSession = async (request: NextRequest) => {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  if (!sessionCookie) return null;

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.session) return null;

  return session;
};

export const findUserOrganization = async (slug: string, userId: string) => {
  const cacheKey = CacheKeys.orgMember(slug, userId);

  try {
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as { id: string; slug: string | null } | null;
    }
  } catch (error) {
    logger.error("[Cache Error] findUserOrganization:", error);
  }

  const org = await prisma.organization.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      members: {
        some: { userId },
      },
    },
    select: { id: true, slug: true },
  });

  if (org) {
    try {
      await redisClient.setex(
        cacheKey,
        CacheTTL.ORG_MEMBER,
        JSON.stringify(org),
      );
    } catch (error) {
      logger.error("[Cache Error] setex findUserOrganization:", error);
    }
  }

  return org;
};

export const getFirstUserOrganization = async (userId: string) => {
  const cacheKey = CacheKeys.userFirstOrg(userId);

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as { id: string; slug: string | null } | null;
    }
  } catch (error) {
    logger.error("[Cache Error] getFirstUserOrganization:", error);
  }

  const org = await prisma.organization.findFirst({
    where: {
      members: {
        some: { userId },
      },
    },
    select: { id: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  if (org) {
    try {
      await redisClient.setex(
        cacheKey,
        CacheTTL.ORG_MEMBER,
        JSON.stringify(org),
      );
    } catch (error) {
      logger.error("[Cache Error] setex getFirstUserOrganization:", error);
    }
  }

  return org;
};

export const redirectToOrgList = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/orgs";
  return NextResponse.redirect(url);
};

export const validateAdminAccess = async (request: NextRequest) => {
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  if (!sessionCookie) return null;

  const session = await auth.api.getSession({ headers: request.headers });

  if (session?.user.role !== "admin") {
    return null;
  }

  return session.user;
};

export const redirectToRoot = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url);
};

export const isAdminRoute = (pathname: string) => {
  return pathname.startsWith("/admin");
};

export const isReservedSlug = (slug: string) => {
  return RESERVED_SLUGS.includes(slug);
};

export const buildOrgRedirectUrl = (request: NextRequest, newSlug: string) => {
  const newUrl = new URL(request.url);
  const parts = request.nextUrl.pathname.split("/");
  parts[2] = newSlug;
  newUrl.pathname = parts.join("/");
  return NextResponse.redirect(newUrl);
};
