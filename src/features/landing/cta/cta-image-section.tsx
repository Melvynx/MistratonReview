import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { SectionLayout } from "../section-layout";

export const CTAImageSection = () => {
  return (
    <div
      style={{
        backgroundImage:
          "url(https://images.unsplash.com/photo-1707680639756-d37ea04572a9?q=80&w=2973&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
        backgroundSize: "cover",
      }}
    >
      <SectionLayout
        variant="image"
        className="flex min-h-[500px] flex-col items-center justify-center gap-4 text-white drop-shadow-md"
      >
        <Typography
          variant="h2"
          className="text-center text-5xl font-extrabold"
        >
          Start reviewing PRs automatically
        </Typography>
        <Typography className="text-center font-bold">
          Install in 30 seconds. No configuration needed.
        </Typography>
        <Link href="#pricing" className={buttonVariants({ size: "lg" })}>
          Get started
        </Link>
      </SectionLayout>
    </div>
  );
};
