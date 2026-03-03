import { fetch } from "@tauri-apps/plugin-http";
import { getValidCredentials, type OAuthCredentials } from "@/jira/tokenManager";

export interface JiraIssue {
  key: string;
  summary: string;
}

export interface JiraUser {
  displayName: string;
  emailAddress: string;
}

function makeHeaders(credentials: OAuthCredentials): Record<string, string> {
  return {
    Authorization: `Bearer ${credentials.accessToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function baseUrl(credentials: OAuthCredentials): string {
  return `https://api.atlassian.com/ex/jira/${credentials.cloudId}`;
}

export async function testConnection(): Promise<JiraUser> {
  const credentials = await getValidCredentials();
  const url = `${baseUrl(credentials)}/rest/api/3/myself`;
  const res = await fetch(url, { method: "GET", headers: makeHeaders(credentials) });

  if (!res.ok) {
    throw new Error(`Jira connection failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return { displayName: data.displayName, emailAddress: data.emailAddress };
}

export async function getAssignedIssues(): Promise<JiraIssue[]> {
  const credentials = await getValidCredentials();
  const jql = encodeURIComponent("assignee=currentUser() AND status!=Done ORDER BY updated DESC");
  const url = `${baseUrl(credentials)}/rest/api/3/search?jql=${jql}&fields=summary&maxResults=50`;
  const res = await fetch(url, { method: "GET", headers: makeHeaders(credentials) });

  if (!res.ok) {
    throw new Error(`Failed to fetch issues: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.issues.map((issue: { key: string; fields: { summary: string } }) => ({
    key: issue.key,
    summary: issue.fields.summary,
  }));
}

export async function addWorklog(
  issueKey: string,
  date: string,
  seconds: number,
  comment?: string,
): Promise<void> {
  const credentials = await getValidCredentials();
  const url = `${baseUrl(credentials)}/rest/api/3/issue/${issueKey}/worklog`;
  const started = `${date}T00:00:00.000+0000`;
  const body: Record<string, unknown> = {
    timeSpentSeconds: seconds,
    started,
  };

  if (comment) {
    body.comment = {
      version: 1,
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: comment }],
        },
      ],
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: makeHeaders(credentials),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to add worklog: ${res.status} ${res.statusText}`);
  }
}
