"use cache";

import type { ReactNode } from "react";
import { DocsMobileHeader, DocsSidebar } from "./_components/docs-sidebar";
import { getDocsTree } from "./doc-manager";

export default async function DocsLayout(props: { children: ReactNode }) {
  const tree = await getDocsTree();

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <DocsMobileHeader tree={tree} />
      <DocsSidebar tree={tree} />
      <main className="flex-1">{props.children}</main>
    </div>
  );
}
