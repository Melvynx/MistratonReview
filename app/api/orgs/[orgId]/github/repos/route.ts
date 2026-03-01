import { getInstallationRepos } from "@/lib/github";
import { route } from "@/lib/zod-route";
import { z } from "zod";

export const GET = route
  .query(
    z.object({
      installation_id: z.coerce.number(),
      q: z.string().optional(),
    }),
  )
  .handler(async (_req, { query }) => {
    const { repositories, totalCount } = await getInstallationRepos(
      query.installation_id,
      { query: query.q, perPage: 20 },
    );

    const repos = repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      isPrivate: repo.private,
      defaultBranch: repo.default_branch,
    }));

    return { repos, totalCount };
  });
