import { fetch } from "@tauri-apps/plugin-http";
import { getSetting, setSetting } from "@/db/database";

export interface OAuthCredentials {
  accessToken: string;
  cloudId: string;
}

const EXPIRY_BUFFER_MS = 60_000;

let refreshPromise: Promise<void> | null = null;

export async function isOAuthConfigured(): Promise<boolean> {
  const [accessToken, cloudId] = await Promise.all([
    getSetting("oauth_access_token"),
    getSetting("oauth_cloud_id"),
  ]);
  return !!accessToken && !!cloudId;
}

export async function getValidCredentials(): Promise<OAuthCredentials> {
  const [accessToken, cloudId, expiresAt] = await Promise.all([
    getSetting("oauth_access_token"),
    getSetting("oauth_cloud_id"),
    getSetting("oauth_token_expires_at"),
  ]);

  if (!accessToken || !cloudId) {
    throw new Error("OAuth not configured. Please connect to Jira first.");
  }

  if (expiresAt && Date.now() >= Number(expiresAt) - EXPIRY_BUFFER_MS) {
    await refreshAccessToken();
    const newToken = await getSetting("oauth_access_token");
    if (!newToken) throw new Error("Token refresh failed");
    return { accessToken: newToken, cloudId };
  }

  return { accessToken, cloudId };
}

async function refreshAccessToken(): Promise<void> {
  if (refreshPromise) {
    await refreshPromise;
    return;
  }

  refreshPromise = doRefresh();
  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function doRefresh(): Promise<void> {
  const [clientId, clientSecret, refreshToken] = await Promise.all([
    getSetting("oauth_client_id"),
    getSetting("oauth_client_secret"),
    getSetting("oauth_refresh_token"),
  ]);

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing OAuth credentials for token refresh");
  }

  const res = await fetch("https://auth.atlassian.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const expiresAt = String(Date.now() + data.expires_in * 1000);

  await Promise.all([
    setSetting("oauth_access_token", data.access_token),
    setSetting("oauth_token_expires_at", expiresAt),
    ...(data.refresh_token
      ? [setSetting("oauth_refresh_token", data.refresh_token)]
      : []),
  ]);
}
