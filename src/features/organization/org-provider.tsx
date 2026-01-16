"use client";

import {
  type CurrentOrgData,
  setCurrentOrg,
  useCurrentOrg,
} from "@/hooks/use-current-org";
import { useEffect } from "react";

type OrgProviderProps = {
  org: CurrentOrgData;
};

/**
 * Injects organization data into the client-side store.
 * Used in the org layout to hydrate the useCurrentOrg hook.
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * const org = await getRequiredCurrentOrgCache();
 * return (
 *   <OrgProvider
 *     org={{
 *       id: org.id,
 *       slug: org.slug,
 *       name: org.name,
 *       image: org.logo,
 *       subscription: org.subscription,
 *     }}
 *   />
 * );
 * ```
 */
export const OrgProvider = ({ org }: OrgProviderProps) => {
  useEffect(() => {
    if (useCurrentOrg.getState()) return;
    setCurrentOrg(org);
  }, [org]);

  return null;
};
