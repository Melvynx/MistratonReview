import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const installationId = url.searchParams.get("installation_id");

  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as {
      error?: string;
      error_description?: string;
    };

    if (tokenData.error) {
      logger.error("GitHub OAuth error:", tokenData.error_description);
      return NextResponse.redirect(
        new URL("/?error=oauth_failed", request.url),
      );
    }

    const redirectUrl = new URL("/orgs/default/setup", request.url);
    if (installationId) {
      redirectUrl.searchParams.set("installation_id", installationId);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logger.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/?error=callback_failed", request.url),
    );
  }
}
