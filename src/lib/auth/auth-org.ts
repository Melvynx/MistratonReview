import { headers } from "next/headers";
import { auth } from "../auth";
import { getRequiredCurrentOrg } from "../organizations/get-org";
import type { AuthPermission } from "./auth-permissions";

export const hasPermission = async (permission: AuthPermission) => {
  const org = await getRequiredCurrentOrg();

  const result = await auth.api.hasPermission({
    headers: await headers(),
    body: {
      permission,
      organizationId: org.id,
    },
  });

  return result.success;
};
