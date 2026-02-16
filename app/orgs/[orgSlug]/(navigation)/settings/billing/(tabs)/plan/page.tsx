import { Typography } from "@/components/nowts/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTH_PLANS, getPlanFeatures } from "@/lib/auth/stripe/auth-plans";
import { getRequiredCurrentOrgCache } from "@/lib/react/cache";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Suspense } from "react";
import { SimplePricingCard } from "../_components/simple-pricing-card";
import { PlanCardAction } from "./_components/plan-card-action";

const STATUS_CONFIG = {
  trialing: {
    label: "Trial",
    color: "bg-blue-500",
  },
  active: {
    label: "Active",
    color: "bg-green-500",
  },
  canceled: {
    label: "Canceled",
    color: "bg-orange-500",
  },
  past_due: {
    label: "Past Due",
    color: "bg-red-500",
  },
  unpaid: {
    label: "Unpaid",
    color: "bg-red-500",
  },
  incomplete: {
    label: "Incomplete",
    color: "bg-yellow-500",
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BillingPlanPage />
    </Suspense>
  );
}

async function BillingPlanPage() {
  const org = await getRequiredCurrentOrgCache({
    permissions: {
      subscription: ["manage"],
    },
  });

  const currentPlanName = org.subscription?.plan ?? "free";

  const statusConfig = org.subscription?.status
    ? STATUS_CONFIG[org.subscription.status as keyof typeof STATUS_CONFIG]
    : null;

  const currentPlan =
    AUTH_PLANS.find((p) => p.name === currentPlanName) ?? AUTH_PLANS[0];
  const currentPrice = currentPlan.price;

  const otherPlans = AUTH_PLANS.filter(
    (plan) => !plan.isHidden && plan.name !== currentPlanName,
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 lg:flex-row">
        <CardHeader className="h-full flex-1 items-start">
          <div className="flex items-center gap-2">
            <CardTitle>
              {currentPlan.name
                ? currentPlan.name.charAt(0).toUpperCase() +
                  currentPlan.name.slice(1)
                : "Current Plan"}
            </CardTitle>
            {statusConfig && (
              <Badge variant="outline" className="gap-1.5">
                <span
                  className={cn("size-1.5 rounded-full", statusConfig.color)}
                  aria-hidden="true"
                ></span>
                {statusConfig.label}
              </Badge>
            )}
          </div>
          <Button disabled>Current plan</Button>
        </CardHeader>
        <CardContent className="flex-2">
          <ul className="grid grid-cols-1 md:grid-cols-2">
            {getPlanFeatures(currentPlan).map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="text-primary size-5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {otherPlans.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <Typography variant="h3" className="font-semibold">
              Available Plans
            </Typography>
            <Typography variant="muted" className="mt-1">
              Manage your subscription
            </Typography>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {otherPlans.map((plan) => {
              const isUpgrade = plan.price > currentPrice;
              const isDowngrade = plan.price < currentPrice;

              const features = getPlanFeatures(plan);

              const ctaLabel = isUpgrade
                ? "Upgrade"
                : isDowngrade
                  ? "Downgrade"
                  : "Change Plan";

              return (
                <SimplePricingCard
                  key={plan.name}
                  title={plan.name}
                  price={`$${plan.price}`}
                  period="month"
                  features={features}
                  action={
                    <PlanCardAction
                      label={ctaLabel}
                      currentPlan={currentPlanName}
                      targetPlan={plan.name}
                    />
                  }
                  className={
                    plan.isPopular ? "border-primary shadow-md" : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
