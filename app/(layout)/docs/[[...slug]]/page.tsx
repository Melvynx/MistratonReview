import { cacheLife } from "next/cache";
import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ServerMdx } from "@/features/markdown/server-mdx";
import { cn } from "@/lib/utils";
import { SiteConfig } from "@/site-config";
import { ArrowLeft, ArrowRight, ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsApiExamples } from "../_components/docs-api-examples";
import { DocsCopyPage } from "../_components/docs-copy-page";
import { DocsTableOfContents, type TocItem } from "../_components/docs-toc";
import type { DocParams } from "../doc-manager";
import { getAllDocs, getCurrentDoc } from "../doc-manager";

export async function generateMetadata(props: DocParams): Promise<Metadata> {
  "use cache";
  cacheLife("max");
  const params = await props.params;

  if (!params.slug || params.slug.length === 0) {
    return {
      title: `Documentation | ${SiteConfig.title}`,
      description: `Everything you need to know about using ${SiteConfig.title}`,
    };
  }

  const doc = await getCurrentDoc(params.slug);

  if (!doc) {
    notFound();
  }

  return {
    title: doc.attributes.title,
    description: doc.attributes.description,
    keywords: doc.attributes.keywords,
  };
}

export async function generateStaticParams() {
  const docs = await getAllDocs();

  return docs.map((doc) => ({
    slug: doc.slug === "" ? undefined : doc.slug.split("/"),
  }));
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const title = match[2].trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    toc.push({
      title,
      url: `#${slug}`,
      depth,
    });
  }

  return toc;
}

export default async function page(props: DocParams) {
  "use cache";
  cacheLife("max");

  const params = await props.params;

  if (!params.slug || params.slug.length === 0) {
    return <DocsIndexPage />;
  }

  const doc = await getCurrentDoc(params.slug);

  if (!doc) {
    notFound();
  }

  const docs = await getAllDocs();

  const currentIndex = docs.findIndex((d) => d.slug === doc.slug);
  const neighbours = {
    previous: currentIndex > 0 ? docs[currentIndex - 1] : null,
    next: currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null,
  };

  const method = doc.attributes.method as
    | "GET"
    | "POST"
    | "PATCH"
    | "DELETE"
    | "PUT"
    | undefined;
  const { endpoint, examples, results } = doc.attributes;

  const hasApiExamples = method ?? endpoint ?? examples ?? results;
  const toc = extractToc(doc.content);
  const pageUrl = `${SiteConfig.prodUrl}/docs/${doc.slug}`;

  return (
    <div className={cn("flex w-full")}>
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-8">
                <Typography
                  variant="h1"
                  className="text-4xl font-bold tracking-tight"
                >
                  {doc.attributes.title}
                </Typography>
                <DocsCopyPage page={doc.content} url={pageUrl} />
              </div>
              {doc.attributes.description && (
                <Typography
                  variant="p"
                  className="text-muted-foreground text-lg"
                >
                  {doc.attributes.description}
                </Typography>
              )}
            </div>

            <ServerMdx source={doc.content} className="w-full max-w-none" />

            <div className="border-border flex items-center justify-between border-t pt-6">
              {neighbours.previous && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/docs/${neighbours.previous.slug}`}>
                    <ArrowLeft className="size-4" />
                    {neighbours.previous.attributes.title}
                  </Link>
                </Button>
              )}
              {neighbours.next && (
                <Button variant="outline" size="sm" className="ml-auto" asChild>
                  <Link href={`/docs/${neighbours.next.slug}`}>
                    {neighbours.next.attributes.title}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {hasApiExamples && (
        <div className="w-full max-w-96 border-l max-2xl:hidden">
          <aside className="bg-background sticky top-14 h-fit max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="p-6">
              <DocsApiExamples
                method={method}
                endpoint={endpoint}
                examples={examples}
                results={results}
              />
            </div>
          </aside>
        </div>
      )}

      {toc.length > 0 && (
        <div className="w-full max-w-64 border-l max-2xl:hidden">
          <aside className="bg-background sticky top-14 h-fit max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="p-6">
              <DocsTableOfContents toc={toc} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

async function DocsIndexPage() {
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
