import fm from "front-matter";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const docsDirectory = path.join(process.cwd(), "content/docs");

const MetaSchema = z.object({
  title: z.string(),
  pages: z.array(z.string()),
});

const AttributeSchema = z.object({
  title: z.string(),
  description: z.string(),
  keywords: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  coverUrl: z.string().optional(),
  order: z.number().optional(),
  subcategory: z.string().optional(),
  method: z.string().optional(),
  endpoint: z.string().optional(),
  examples: z.record(z.string(), z.string()).optional(),
  results: z.record(z.string(), z.string()).optional(),
  links: z
    .object({
      doc: z.string().optional(),
      api: z.string().optional(),
    })
    .optional(),
});

type DocAttributes = z.infer<typeof AttributeSchema>;

export type DocType = {
  slug: string;
  url: string;
  attributes: DocAttributes;
  content: string;
};

export type DocFolder = {
  name: string;
  slug: string;
  docs: DocType[];
};

export type DocTree = {
  rootDocs: DocType[];
  folders: DocFolder[];
};

async function readMdxFile(
  filePath: string,
  slug: string,
): Promise<DocType | null> {
  try {
    const fileContents = await fs.readFile(filePath, "utf8");
    const matter = fm(fileContents);
    const result = AttributeSchema.safeParse(matter.attributes);

    if (!result.success) {
      return null;
    }

    return {
      slug,
      url: `/docs/${slug}`,
      content: matter.body,
      attributes: result.data,
    };
  } catch {
    return null;
  }
}

async function getMetaOrder(dirPath: string): Promise<string[] | null> {
  try {
    const metaPath = path.join(dirPath, "meta.json");
    const metaContents = await fs.readFile(metaPath, "utf8");
    const meta = MetaSchema.safeParse(JSON.parse(metaContents));
    if (meta.success) {
      return meta.data.pages;
    }
    return null;
  } catch {
    return null;
  }
}

async function getFolderTitle(
  folderPath: string,
  fallback: string,
): Promise<string> {
  try {
    const metaPath = path.join(folderPath, "meta.json");
    const metaContents = await fs.readFile(metaPath, "utf8");
    const meta = JSON.parse(metaContents);
    return meta.title ?? fallback;
  } catch {
    return fallback;
  }
}

async function processFolder(folderName: string): Promise<DocFolder> {
  const folderPath = path.join(docsDirectory, folderName);
  const [folderOrder, folderTitle, folderFiles] = await Promise.all([
    getMetaOrder(folderPath),
    getFolderTitle(folderPath, folderName),
    fs.readdir(folderPath),
  ]);

  const mdxFiles = folderFiles.filter((file) => file.endsWith(".mdx"));
  const docsPromises = mdxFiles.map(async (file) => {
    const fileName = file.replace(".mdx", "");
    const slug =
      fileName === "index" ? folderName : `${folderName}/${fileName}`;
    return readMdxFile(path.join(folderPath, file), slug);
  });

  const docsResults = await Promise.all(docsPromises);
  const folderDocs = docsResults.filter((doc): doc is DocType => doc !== null);

  if (folderOrder) {
    folderDocs.sort((a, b) => {
      const aName = a.slug.includes("/") ? a.slug.split("/")[1] : "index";
      const bName = b.slug.includes("/") ? b.slug.split("/")[1] : "index";
      const aIndex = folderOrder.indexOf(aName);
      const bIndex = folderOrder.indexOf(bName);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }

  return {
    name: folderTitle,
    slug: folderName,
    docs: folderDocs,
  };
}

export async function getDocsTree(): Promise<DocTree> {
  try {
    const entries = await fs.readdir(docsDirectory, { withFileTypes: true });
    const rootOrder = await getMetaOrder(docsDirectory);

    const directories = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    const mdxFiles = entries
      .filter((e) => e.name.endsWith(".mdx"))
      .map((e) => e.name);

    const [physicalFolders, rootDocsResults] = await Promise.all([
      Promise.all(directories.map(processFolder)),
      Promise.all(
        mdxFiles.map(async (file) => {
          const fileName = file.replace(".mdx", "");
          const slug = fileName === "index" ? "" : fileName;
          return readMdxFile(path.join(docsDirectory, file), slug);
        }),
      ),
    ]);

    const rootDocs = rootDocsResults.filter(
      (doc): doc is DocType => doc !== null,
    );

    // Group root docs by subcategory to create virtual folders
    const subcategoryGroups: Record<string, DocType[]> = {};
    const docsWithoutSubcategory: DocType[] = [];

    for (const doc of rootDocs) {
      if (doc.attributes.subcategory) {
        const subcategory = doc.attributes.subcategory;
        subcategoryGroups[subcategory] ??= [];
        subcategoryGroups[subcategory].push(doc);
      } else {
        docsWithoutSubcategory.push(doc);
      }
    }

    // Sort docs within each subcategory by order or title
    Object.keys(subcategoryGroups).forEach((key) => {
      subcategoryGroups[key].sort((a, b) => {
        if (
          a.attributes.order !== undefined &&
          b.attributes.order !== undefined
        ) {
          return a.attributes.order - b.attributes.order;
        }
        return a.attributes.title.localeCompare(b.attributes.title);
      });
    });

    // Convert subcategory groups to folders
    const virtualFolders: DocFolder[] = Object.keys(subcategoryGroups)
      .sort((a, b) => a.localeCompare(b))
      .map((subcategory) => ({
        name: subcategory,
        slug: subcategory.toLowerCase().replace(/\s+/g, "-"),
        docs: subcategoryGroups[subcategory],
      }));

    // Combine physical folders and virtual folders
    const allFolders = [...physicalFolders, ...virtualFolders];

    if (rootOrder) {
      docsWithoutSubcategory.sort((a, b) => {
        const aName = a.slug || "index";
        const bName = b.slug || "index";
        const aIndex = rootOrder.indexOf(aName);
        const bIndex = rootOrder.indexOf(bName);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      allFolders.sort((a, b) => {
        const aIndex = rootOrder.indexOf(a.slug);
        const bIndex = rootOrder.indexOf(b.slug);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return { rootDocs: docsWithoutSubcategory, folders: allFolders };
  } catch {
    return { rootDocs: [], folders: [] };
  }
}

export async function getAllDocs(): Promise<DocType[]> {
  const tree = await getDocsTree();
  const allDocs: DocType[] = [...tree.rootDocs];
  for (const folder of tree.folders) {
    allDocs.push(...folder.docs);
  }
  return allDocs;
}

export async function getCurrentDoc(
  slugParts: string[] | undefined,
): Promise<DocType | null> {
  const slug = slugParts?.join("/") ?? "";
  const allDocs = await getAllDocs();
  return allDocs.find((doc) => doc.slug === slug) ?? null;
}

export type DocParams = {
  params: Promise<{ slug?: string[] }>;
};
