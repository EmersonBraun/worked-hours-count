import { fetch } from "@tauri-apps/plugin-http";
import { openUrl } from "@tauri-apps/plugin-opener";
import { getSetting, setSetting, deleteSetting } from "@/db/database";

const AUTHORIZE_URL = "https://auth.atlassian.com/authorize";
const TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const RESOURCES_URL = "https://api.atlassian.com/oauth/token/accessible-resources";
const REDIRECT_URI = "worked-hours://auth/callback";
const SCOPES = "read:jira-work write:jira-work read:me offline_access";

let pendingState: string | null = null;

export async function startOAuthFlow(): Promise<void> {
  const clientId = await getSetting("oauth_client_id");
  if (!clientId) {
    throw new Error("OAuth Client ID not configured. Please save it first.");
  }

  pendingState = crypto.randomUUID();

  const params = new URLSearchParams({
    audience: "api.atlassian.com",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state: pendingState,
    response_type: "code",
    prompt: "consent",
  });

  await openUrl(`${AUTHORIZE_URL}?${params.toString()}`);
}

export async function handleOAuthCallback(url: string): Promise<string> {
  const parsed = new URL(url);
  const code = parsed.searchParams.get("code");
  const state = parsed.searchParams.get("state");
  const error = parsed.searchParams.get("error");

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!code) {
    throw new Error("No authorization code received");
  }

  if (!pendingState || state !== pendingState) {
    throw new Error("Invalid OAuth state - possible CSRF attack");
  }
  pendingState = null;

  const [clientId, clientSecret] = await Promise.all([
    getSetting("oauth_client_id"),
    getSetting("oauth_client_secret"),
  ]);

  if (!clientId || !clientSecret) {
    throw new Error("OAuth credentials not configured");
  }

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`Token exchange failed: ${tokenRes.status} - ${body}`);
  }

  const tokenData = await tokenRes.json();
  const expiresAt = String(Date.now() + tokenData.expires_in * 1000);

  await Promise.all([
    setSetting("oauth_access_token", tokenData.access_token),
    setSetting("oauth_refresh_token", tokenData.refresh_token),
    setSetting("oauth_token_expires_at", expiresAt),
  ]);

  const resourcesRes = await fetch(RESOURCES_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
    },
  });

  if (!resourcesRes.ok) {
    throw new Error(`Failed to fetch accessible resources: ${resourcesRes.status}`);
  }

  const resources = await resourcesRes.json();
  if (!resources.length) {
    throw new Error("No accessible Jira sites found for this account");
  }

  const site = resources[0];
  await Promise.all([
    setSetting("oauth_cloud_id", site.id),
    setSetting("oauth_site_name", site.name),
    setSetting("oauth_site_url", site.url),
  ]);

  return site.name;
}

const OAUTH_KEYS = [
  "oauth_access_token",
  "oauth_refresh_token",
  "oauth_token_expires_at",
  "oauth_cloud_id",
  "oauth_site_name",
  "oauth_site_url",
];

export async function disconnectOAuth(): Promise<void> {
  await Promise.all(OAUTH_KEYS.map((key) => deleteSetting(key)));
}
