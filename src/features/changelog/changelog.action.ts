"use server";

import { getUser } from "@/lib/auth/auth-user";
import { redisClient } from "@/lib/redis";

const DISMISSED_CHANGELOG_KEY = (userId: string) =>
  `changelog:dismissed:${userId}`;

export async function dismissChangelogAction(slug: string) {
  const user = await getUser();
  if (!user) return;

  const key = DISMISSED_CHANGELOG_KEY(user.id);
  await redisClient.sadd(key, slug);
}

export async function dismissAllChangelogsAction(slugs: string[]) {
  const user = await getUser();
  if (!user) return;
  if (slugs.length === 0) return;

  const key = DISMISSED_CHANGELOG_KEY(user.id);
  await redisClient.sadd(key, ...slugs);
}

export async function getDismissedChangelogs(): Promise<string[]> {
  const user = await getUser();
  if (!user) return [];

  const key = DISMISSED_CHANGELOG_KEY(user.id);
  return redisClient.smembers(key);
}

export async function resetDismissedChangelogsAction() {
  const user = await getUser();
  if (!user) return;

  const key = DISMISSED_CHANGELOG_KEY(user.id);
  await redisClient.del(key);
}
