"use client";

import { LoadingButton } from "@/features/form/submit-button";
import { upgradeOrgAction } from "@/features/plans/plans.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { openStripePortalAction } from "../../../billing.action";

type PlanCardActionProps = {
  label: string;
  variant?: "default" | "outline" | "secondary";
  currentPlan: string;
  targetPlan: string;
};

export function PlanCardAction({
  label,
  variant = "default",
  currentPlan,
  targetPlan,
}: PlanCardActionProps) {
  const pathname = usePathname();
  const isFreePlan = currentPlan === "free";

  const mutation = useMutation({
    mutationFn: async () => {
      if (isFreePlan) {
        return resolveActionResult(
          upgradeOrgAction({
            plan: targetPlan,
            annual: false,
            successUrl: pathname,
            cancelUrl: pathname,
          }),
        );
      }
      return resolveActionResult(openStripePortalAction());
    },
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url;
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <LoadingButton
      onClick={() => mutation.mutate()}
      loading={mutation.isPending}
      variant={variant}
      className="w-full"
    >
      {label}
    </LoadingButton>
  );
}
