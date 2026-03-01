"use server";

import { getRequiredCurrentOrg } from "@/lib/organizations/get-org";
import { prisma } from "@/lib/prisma";
import { action } from "@/lib/actions/safe-actions";
import { z } from "zod";

const saveInstallationSchema = z.object({
  installationId: z.number(),
  accountLogin: z.string(),
});

const saveSelectedReposSchema = z.object({
  installationId: z.string(),
  repos: z.array(
    z.object({
      githubId: z.number(),
      name: z.string(),
      fullName: z.string(),
      isPrivate: z.boolean(),
      defaultBranch: z.string(),
    }),
  ),
});

export const saveInstallationAction = action
  .inputSchema(saveInstallationSchema)
  .action(async ({ parsedInput }) => {
    const org = await getRequiredCurrentOrg();
    const installation = await prisma.githubInstallation.upsert({
      where: { installationId: parsedInput.installationId },
      create: {
        installationId: parsedInput.installationId,
        accountLogin: parsedInput.accountLogin,
        organizationId: org.id,
      },
      update: {
        accountLogin: parsedInput.accountLogin,
      },
      select: { id: true, installationId: true },
    });
    return installation;
  });

export const saveSelectedReposAction = action
  .inputSchema(saveSelectedReposSchema)
  .action(async ({ parsedInput }) => {
    const org = await getRequiredCurrentOrg();
    await prisma.githubRepository.deleteMany({
      where: {
        installationId: parsedInput.installationId,
        organizationId: org.id,
      },
    });

    if (parsedInput.repos.length > 0) {
      await prisma.githubRepository.createMany({
        data: parsedInput.repos.map((repo) => ({
          githubId: repo.githubId,
          name: repo.name,
          fullName: repo.fullName,
          private: repo.isPrivate,
          defaultBranch: repo.defaultBranch,
          installationId: parsedInput.installationId,
          organizationId: org.id,
        })),
      });
    }

    return { success: true };
  });
