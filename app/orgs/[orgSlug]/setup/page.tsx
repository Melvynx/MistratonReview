import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { buttonVariants } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { prisma } from "@/lib/prisma";
import { SetupRepos } from "./setup-repos";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SetupPage(props: PageProps) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const org = await getRequiredCurrentOrgCache();
  const installationId = Number(searchParams.installation_id);

  const isManageMode = searchParams.manage === "true";

  const existingInstallation = await prisma.githubInstallation.findFirst({
    where: { organizationId: org.id },
    select: {
      id: true,
      installationId: true,
      repositories: {
        where: { isActive: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (
    !isManageMode &&
    existingInstallation &&
    existingInstallation.repositories.length > 0
  ) {
    return (
      <Layout>
        <LayoutHeader>
          <LayoutTitle>Setup Complete</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="size-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">
                MistratonReview is Ready
              </CardTitle>
              <CardDescription>
                Your repositories are configured. Every new pull request will be
                automatically reviewed by Mistral AI.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link
                href={`/orgs/${params.orgSlug}`}
                className={buttonVariants()}
              >
                Go to Dashboard
              </Link>
            </CardContent>
          </Card>
        </LayoutContent>
      </Layout>
    );
  }

  if (!installationId || isNaN(installationId)) {
    return (
      <Layout>
        <LayoutHeader>
          <LayoutTitle>Setup</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="size-8 text-red-600" />
              </div>
              <CardTitle>Installation Required</CardTitle>
              <CardDescription>
                Please install the MistratonReview GitHub App first.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link
                href="https://github.com/apps/mistratonreview/installations/new"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants()}
              >
                Install on GitHub
              </Link>
            </CardContent>
          </Card>
        </LayoutContent>
      </Layout>
    );
  }

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>Select Repositories</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <SetupRepos installationId={installationId} orgSlug={params.orgSlug} />
      </LayoutContent>
    </Layout>
  );
}
