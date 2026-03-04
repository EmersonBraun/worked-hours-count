import { getSetting, setSetting, deleteSetting } from "@/db/database";

export interface JiraCredentials {
  email: string;
  domain: string;
  apiToken: string;
}

const JIRA_KEYS = ["jira_email", "jira_domain", "jira_api_token"] as const;

export async function isJiraConfigured(): Promise<boolean> {
  const [email, domain, apiToken] = await Promise.all(
    JIRA_KEYS.map((key) => getSetting(key)),
  );
  return !!email && !!domain && !!apiToken;
}

export async function getCredentials(): Promise<JiraCredentials> {
  const [email, domain, apiToken] = await Promise.all(
    JIRA_KEYS.map((key) => getSetting(key)),
  );

  if (!email || !domain || !apiToken) {
    throw new Error("Jira not configured. Please fill in email, domain and API token in Settings.");
  }

  return { email, domain, apiToken };
}

export async function saveCredentials(email: string, domain: string, apiToken: string): Promise<void> {
  await Promise.all([
    setSetting("jira_email", email),
    setSetting("jira_domain", domain),
    setSetting("jira_api_token", apiToken),
  ]);
}

export async function disconnectJira(): Promise<void> {
  await Promise.all(JIRA_KEYS.map((key) => deleteSetting(key)));
}
