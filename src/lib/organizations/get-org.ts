import { headers } from "next/headers";
import { unauthorized } from "next/navigation";
import { auth } from "../auth";
import type { AuthPermission, AuthRole } from "../auth/auth-permissions";
import { getPlanLimits } from "../auth/stripe/auth-plans";
import { getSession } from "../auth/auth-user";
import { logger } from "../logger";
import { prisma } from "../prisma";
import { getOrgActiveSubscription } from "./get-org-subscription";
import { isInRoles } from "./is-in-roles";

const getOrgSlugFromHeaders = async (): Promise<string | null> => {
  const headersList = await headers();
  return headersList.get("x-org-slug");
};

type OrgParams = {
  roles?: AuthRole[];
  permissions?: AuthPermission;
};

const getFullOrg = async (orgId: string, userId: string) => {
  return prisma.organization.findUnique({
    where: {
      id: orgId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      metadata: true,
      createdAt: true,
      stripeCustomerId: true,
      members: {
        where: {
          OR: [{ userId: userId }, { role: "owner" }],
        },
        select: {
          createdAt: true,
          id: true,
          role: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              email: true,
              name: true,
              id: true,
            },
          },
        },
        take: 2,
      },
    },
  });
};

const getOrg = async () => {
  const user = await getSession();

  if (!user) {
    return null;
  }

  const orgSlug = await getOrgSlugFromHeaders();

  if (!orgSlug) {
    logger.warn("No organization slug found in headers");
    return null;
  }

  try {
    const authOrg = await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationSlug: orgSlug },
    });

    if (!authOrg) {
      logger.warn(`Organization not found for slug: ${orgSlug}`);
      return null;
    }

    return getFullOrg(authOrg.id, user.session.userId);
  } catch (err) {
    logger.error("Error fetching organization", err);
    return null;
  }
};

export const getCurrentOrg = async (params?: OrgParams) => {
  const user = await getSession();

  if (!user) {
    return null;
  }

  const org = await getOrg();

  if (!org) {
    return null;
  }

  const memberRoles = org.members
    .filter((member) => member.userId === user.session.userId)
    .map((member) => member.role);

  if (
    memberRoles.length === 0 ||
    !isInRoles(memberRoles as AuthRole[], params?.roles)
  ) {
    return null;
  }

  if (params?.permissions) {
    const hasPermission = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permission: params.permissions,
        organizationId: org.id,
      },
    });

    if (!hasPermission.success) {
      return null;
    }
  }

  const [currentSubscription, owner] = await Promise.all([
    getOrgActiveSubscription(org.id),
    org.members.find((member) => member.role === "owner")
      ? Promise.resolve(org.members.find((member) => member.role === "owner"))
      : prisma.member.findFirst({
          where: {
            organizationId: org.id,
            role: "owner",
          },
          select: {
            role: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        }),
  ]);

  const limits = currentSubscription?.limits ?? getPlanLimits();

  return {
    ...org,
    slug: org.slug ?? "",
    user: user.user,
    email: (owner?.user.email ?? null) as string | null,
    memberRoles: memberRoles as AuthRole[],
    subscription: currentSubscription ?? null,
    limits,
  };
};

export type CurrentOrgPayload = NonNullable<
  Awaited<ReturnType<typeof getCurrentOrg>>
>;

export const getRequiredCurrentOrg = async (params?: OrgParams) => {
  const result = await getCurrentOrg(params);

  if (!result) {
    unauthorized();
  }

  return result;
};
