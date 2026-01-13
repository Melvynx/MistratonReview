import { cacheLife } from "next/cache";
import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteConfig } from "@/site-config";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getAllDocs } from "./doc-manager";

export const metadata = {
  title: `Documentation | ${SiteConfig.title}`,
  description: `Everything you need to know about using ${SiteConfig.title}`,
};

export default function Page(props: PageProps<"/docs">) {
  return (
    <Suspense fallback={null}>
      <DocsPage {...props} />
    </Suspense>
  );
}

async function DocsPage(_props: PageProps<"/docs">) {
  "use cache";
  cacheLife("max");
  const docs = await getAllDocs();

  const sortedDocs = [...docs].sort((a, b) => {
    if (a.attributes.order !== undefined && b.attributes.order !== undefined) {
      return a.attributes.order - b.attributes.order;
    }
    return a.attributes.title.localeCompare(b.attributes.title);
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Typography
            variant="h1"
            className="text-4xl font-bold tracking-tight"
          >
            Documentation
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-lg">
            Everything you need to know about using {SiteConfig.title}
          </Typography>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {sortedDocs.map((doc) => (
            <Card key={doc.slug} className="h-fit overflow-hidden">
              {doc.attributes.coverUrl && (
                <div
                  className="h-36 bg-cover bg-center"
                  style={{ backgroundImage: `url(${doc.attributes.coverUrl})` }}
                />
              )}
              <CardHeader>
                <CardTitle>{doc.attributes.title}</CardTitle>
                <CardDescription>{doc.attributes.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link
                  href={`/docs/${doc.slug}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Read More <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
