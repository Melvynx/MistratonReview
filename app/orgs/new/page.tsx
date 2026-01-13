import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { Suspense } from "react";
import { AccountNavigation } from "../../(logged-in)/(account-layout)/account-navigation";
import { NewOrganizationForm } from "./new-org-form";

export default async function Page() {
  return (
    <AccountNavigation>
      <Layout size="lg">
        <LayoutHeader>
          <LayoutTitle>Create a new organization</LayoutTitle>
        </LayoutHeader>
        <LayoutContent>
          <Suspense fallback={null}>
            <RoutePage />
          </Suspense>
        </LayoutContent>
      </Layout>
    </AccountNavigation>
  );
}

async function RoutePage() {
  await getRequiredUser();

  return <NewOrganizationForm />;
}
