import { OrgProvider } from "@/features/organization/org-provider";
import { orgMetadata } from "@/lib/metadata";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(
  props: LayoutProps<"/orgs/[orgSlug]">,
): Promise<Metadata> {
  const params = await props.params;
  return orgMetadata(params.orgSlug);
}

export default async function RouteLayout(
  props: LayoutProps<"/orgs/[orgSlug]">,
) {
  return (
    <>
      {props.children}
      <Suspense fallback={null}>
        <LayoutPage />
      </Suspense>
    </>
  );
}

const LayoutPage = async () => {
  const org = await getRequiredCurrentOrgCache();
  return (
    <OrgProvider
      org={{
        id: org.id,
        slug: org.slug,
        name: org.name,
        image: org.logo ?? null,
        subscription: org.subscription,
      }}
    />
  );
};
