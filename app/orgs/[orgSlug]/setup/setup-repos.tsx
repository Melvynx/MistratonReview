"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { upfetch } from "@/lib/up-fetch";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import {
  saveInstallationAction,
  saveSelectedReposAction,
} from "@/features/github/setup.action";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/nowts/typography";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  GitFork,
  Lock,
  Globe,
  Loader2,
  CheckCircle,
  Search,
  Plus,
  X,
} from "lucide-react";

type GithubRepo = {
  id: number;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
};

type ReposResponse = {
  repos: GithubRepo[];
  totalCount: number;
};

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SetupRepos({
  installationId,
  orgSlug,
}: {
  installationId: number;
  orgSlug: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<Map<number, GithubRepo>>(
    new Map(),
  );
  const [saving, setSaving] = useState(false);
  const [installationDbId, setInstallationDbId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const initDone = useRef(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const save = async () => {
      try {
        const installation = await resolveActionResult(
          saveInstallationAction({
            installationId,
            accountLogin: "github",
          }),
        );
        setInstallationDbId(installation.id);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to save installation";
        setInitError(msg);
        toast.error(msg);
      }
    };
    void save();
  }, [installationId]);

  const {
    data,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["github-repos", installationId, orgSlug, debouncedSearch],
    queryFn: async () => {
      return upfetch(`/api/orgs/${orgSlug}/github/repos`, {
        params: {
          installation_id: installationId,
          ...(debouncedSearch ? { q: debouncedSearch } : {}),
        },
      }) as Promise<ReposResponse>;
    },
  });

  const repos = data?.repos ?? [];

  const addRepo = (repo: GithubRepo) => {
    setSelectedRepos((prev) => {
      const next = new Map(prev);
      next.set(repo.id, repo);
      return next;
    });
  };

  const removeRepo = (repoId: number) => {
    setSelectedRepos((prev) => {
      const next = new Map(prev);
      next.delete(repoId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!installationDbId || selectedRepos.size === 0) {
      toast.error("Please select at least one repository");
      return;
    }
    setSaving(true);
    try {
      const reposToSave = Array.from(selectedRepos.values()).map((r) => ({
        githubId: r.id,
        name: r.name,
        fullName: r.fullName,
        isPrivate: r.isPrivate,
        defaultBranch: r.defaultBranch,
      }));

      await resolveActionResult(
        saveSelectedReposAction({
          installationId: installationDbId,
          repos: reposToSave,
        }),
      );
      toast.success("Repositories configured successfully!");
      router.push(`/orgs/${orgSlug}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save repositories";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (initError) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{initError}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {selectedRepos.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Selected ({selectedRepos.size})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedRepos.values()).map((repo) => (
                <button
                  key={repo.id}
                  type="button"
                  onClick={() => removeRepo(repo.id)}
                  className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors"
                >
                  {repo.name}
                  <X className="size-3" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Repositories</CardTitle>
          <CardDescription>
            Search and add repositories to receive AI code reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="text-muted-foreground size-5 animate-spin" />
                </div>
              ) : fetchError ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Typography variant="muted">
                    Failed to load repositories
                  </Typography>
                </div>
              ) : repos.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Typography variant="muted">
                    {debouncedSearch
                      ? `No repositories match "${debouncedSearch}"`
                      : "No repositories found"}
                  </Typography>
                </div>
              ) : (
                repos.map((repo) => {
                  const isSelected = selectedRepos.has(repo.id);
                  return (
                    <button
                      type="button"
                      key={repo.id}
                      onClick={() =>
                        isSelected ? removeRepo(repo.id) : addRepo(repo)
                      }
                      className={`flex items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-primary/30 border"
                          : "hover:bg-secondary/30 border border-transparent"
                      }`}
                    >
                      <GitFork className="text-muted-foreground size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <Typography
                          variant="small"
                          className="truncate font-medium"
                        >
                          {repo.name}
                        </Typography>
                        <Typography variant="muted" className="truncate">
                          {repo.fullName}
                        </Typography>
                      </div>
                      {repo.isPrivate ? (
                        <Lock className="text-muted-foreground size-3.5 shrink-0" />
                      ) : (
                        <Globe className="text-muted-foreground size-3.5 shrink-0" />
                      )}
                      {isSelected ? (
                        <CheckCircle className="text-primary size-4 shrink-0" />
                      ) : (
                        <Plus className="text-muted-foreground size-4 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || selectedRepos.size === 0 || !installationDbId}
          size="lg"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle className="size-4" />
          )}
          {saving
            ? "Saving..."
            : `Save ${selectedRepos.size} ${selectedRepos.size === 1 ? "repo" : "repos"} & Continue`}
        </Button>
      </div>
    </div>
  );
}
