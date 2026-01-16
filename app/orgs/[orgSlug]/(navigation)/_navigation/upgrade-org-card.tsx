import { buttonVariants } from "@/components/ui/button";
import {
  Item,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import Link from "next/link";
import { useCurrentOrg } from "@/hooks/use-current-org";

export const UpgradeCard = () => {
  const org = useCurrentOrg();

  if (!org) return null;

  if (org.subscription) return null;

  return (
    <Item variant="outline">
      <ItemHeader className="flex flex-col items-start gap-0">
        <ItemTitle>Upgrade</ItemTitle>
        <ItemDescription>
          Unlock all features and get unlimited access to our app.
        </ItemDescription>
      </ItemHeader>
      <ItemFooter>
        <Link
          href={`/orgs/${org.slug}/settings/billing`}
          className={buttonVariants({ className: "w-full" })}
        >
          Upgrade
        </Link>
      </ItemFooter>
    </Item>
  );
};
