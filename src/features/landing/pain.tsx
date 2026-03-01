"use client";

import { Typography } from "@/components/nowts/typography";
import { SectionLayout } from "./section-layout";

export const PainSection = () => {
  return (
    <SectionLayout
      variant="card"
      size="base"
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="flex w-full flex-col items-center gap-3 lg:gap-4 xl:gap-6">
        <Typography variant="h1">Code review slows everyone down...</Typography>
        <Typography variant="large">
          PRs pile up, bugs slip through, and reviewers burn out
        </Typography>
        <div className="flex items-start gap-4 max-lg:flex-col">
          <div className="flex-1 rounded-lg bg-red-500/20 p-4 lg:p-6">
            <Typography variant="h3" className="text-red-500">
              Without MistratonReview
            </Typography>
            <ul className="text-foreground/80 mt-4 ml-4 flex list-disc flex-col gap-2 text-lg">
              <li>Waiting hours for a reviewer to be available</li>
              <li>PRs pile up and block the team</li>
              <li>Bugs slip through when reviewers are fatigued</li>
              <li>Inconsistent review quality across PRs</li>
            </ul>
          </div>
          <div className="flex-1 rounded-lg bg-green-500/20 p-4 lg:p-6">
            <Typography variant="h3" className="text-green-500">
              With MistratonReview
            </Typography>
            <ul className="text-foreground/80 mt-4 ml-4 flex list-disc flex-col gap-2 text-lg">
              <li>Every PR reviewed in seconds, automatically</li>
              <li>Bugs caught before merge, not after deploy</li>
              <li>Consistent, thorough reviews 24/7</li>
              <li>Human reviewers focus on architecture decisions</li>
            </ul>
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};
