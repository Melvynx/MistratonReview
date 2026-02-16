"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import type { Changelog } from "./changelog-manager";
import {
  dismissAllChangelogsAction,
  dismissChangelogAction,
} from "./changelog.action";

type ChangelogSidebarStackProps = {
  changelogs: Changelog[];
  className?: string;
};

export function ChangelogSidebarStack({
  changelogs: initialChangelogs,
  className,
}: ChangelogSidebarStackProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [changelogs, optimisticDismiss] = useOptimistic(
    initialChangelogs,
    (state, action: { type: "one"; slug: string } | { type: "all" }) => {
      if (action.type === "all") return [];
      return state.filter((c) => c.slug !== action.slug);
    },
  );

  const handleDismiss = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      optimisticDismiss({ type: "one", slug });
      await dismissChangelogAction(slug);
      router.refresh();
    });
  };

  const handleDismissAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const allSlugs = changelogs.map((c) => c.slug);
    startTransition(async () => {
      optimisticDismiss({ type: "all" });
      await dismissAllChangelogsAction(allSlugs);
      router.refresh();
    });
  };

  if (changelogs.length === 0) {
    return null;
  }

  const visibleCards = changelogs.slice(0, 3);

  return (
    <div className={cn("mt-4 flex flex-col gap-2", className)}>
      <div className="relative h-40 w-full" data-changelog-stack>
        {visibleCards.map((changelog, index) => {
          const { attributes } = changelog;

          return (
            <div
              key={changelog.slug}
              className="bg-card absolute inset-x-0 cursor-pointer overflow-hidden rounded-lg border shadow-lg"
              style={{
                top: index * -8,
                transform: `scale(${1 - index * 0.04})`,
                zIndex: visibleCards.length - index,
                transformOrigin: "top center",
              }}
              onClick={() => router.push(`/changelog/${changelog.slug}`)}
            >
              <div className="block">
                {attributes.image && (
                  <div className="relative aspect-[2.5/1] w-full">
                    <Image
                      src={attributes.image}
                      alt={attributes.title ?? "Changelog"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {attributes.title ?? "New Update"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(attributes.date)}
                    </p>
                  </div>
                  {index === 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground size-6 shrink-0"
                      onClick={(e) => handleDismiss(changelog.slug, e)}
                      disabled={isPending}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {changelogs.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-auto self-end py-1 text-xs"
          onClick={handleDismissAll}
          disabled={isPending}
        >
          Dismiss all
        </Button>
      )}
    </div>
  );
}
