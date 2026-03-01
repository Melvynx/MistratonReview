import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { SectionLayout } from "../section-layout";

export function CtaSection() {
  return (
    <SectionLayout className="lg:flex lg:items-center lg:justify-between lg:px-8">
      <Typography variant="h3">
        <Typography variant="h2" as="span">
          Ready to automate your code reviews?
        </Typography>
        <br />
        <span className="text-muted-foreground">
          Install once, review every PR automatically.
        </span>
      </Typography>
      <div className="mt-10 flex items-center gap-x-6 lg:mt-0 lg:shrink-0">
        <Link className={buttonVariants({ size: "lg" })} href="#pricing">
          Get Started Free
        </Link>
      </div>
    </SectionLayout>
  );
}
