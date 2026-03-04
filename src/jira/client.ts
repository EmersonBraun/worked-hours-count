import { fetch } from "@tauri-apps/plugin-http";
import { getCredentials, type JiraCredentials } from "@/jira/tokenManager";

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
}

export interface JiraUser {
  displayName: string;
  emailAddress: string;
}

function makeHeaders(credentials: JiraCredentials): Record<string, string> {
  const encoded = btoa(`${credentials.email}:${credentials.apiToken}`);
  return {
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

function baseUrl(credentials: JiraCredentials): string {
  const domain = credentials.domain.replace(/\/+$/, "");
  const host = domain.includes("://") ? domain : `https://${domain}`;
  return `${host}/rest/api/3`;
}

export async function testConnection(): Promise<JiraUser> {
  const credentials = await getCredentials();
  const url = `${baseUrl(credentials)}/myself`;
  console.log("[Jira] testConnection URL:", url);
  console.log("[Jira] domain:", credentials.domain, "| email:", credentials.email);

  const res = await fetch(url, { method: "GET", headers: makeHeaders(credentials) });

  if (!res.ok) {
    const body = await res.text();
    console.error("[Jira] testConnection failed:", res.status, res.statusText, body);
    throw new Error(`Jira connection failed (${res.status}): ${body || res.statusText}`);
  }

  const data = await res.json();
  console.log("[Jira] testConnection OK:", data.displayName);
  return { displayName: data.displayName, emailAddress: data.emailAddress };
}

export async function getAssignedIssues(): Promise<JiraIssue[]> {
  const credentials = await getCredentials();
  const jql = encodeURIComponent("assignee=currentUser() AND status!=Done ORDER BY updated DESC");
  const url = `${baseUrl(credentials)}/search/jql?jql=${jql}&fields=summary,status&maxResults=50`;
  const res = await fetch(url, { method: "GET", headers: makeHeaders(credentials) });

  if (!res.ok) {
    throw new Error(`Failed to fetch issues: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.issues.map((issue: { key: string; fields: { summary: string; status: { name: string } } }) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
  }));
}

export async function getIssueStatuses(issueKeys: string[]): Promise<Map<string, string>> {
  if (issueKeys.length === 0) return new Map();
  const credentials = await getCredentials();
  const keysJql = issueKeys.map((k) => `"${k}"`).join(",");
  const jql = encodeURIComponent(`key in (${keysJql})`);
  const url = `${baseUrl(credentials)}/search/jql?jql=${jql}&fields=status&maxResults=${issueKeys.length}`;
  const res = await fetch(url, { method: "GET", headers: makeHeaders(credentials) });

  if (!res.ok) {
    throw new Error(`Failed to fetch statuses: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const map = new Map<string, string>();
  for (const issue of data.issues) {
    map.set(issue.key, issue.fields.status.name);
  }
  return map;
}

export async function addWorklog(
  issueKey: string,
  date: string,
  seconds: number,
  comment?: string,
): Promise<void> {
  const credentials = await getCredentials();
  const url = `${baseUrl(credentials)}/issue/${issueKey}/worklog`;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addComment(issueKey: string, adfContent: Record<string, unknown>[]): Promise<void> {
  const credentials = await getCredentials();
  const url = `${baseUrl(credentials)}/issue/${issueKey}/comment`;
  const body = {
    body: {
      version: 1,
      type: "doc",
      content: adfContent,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: makeHeaders(credentials),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to add comment: ${res.status} ${res.statusText}`);
  }
}

function adfText(text: string, bold = false): Record<string, unknown> {
  const node: Record<string, unknown> = { type: "text", text };
  if (bold) node.marks = [{ type: "strong" }];
  return node;
}

function adfTableCell(text: string, header = false): Record<string, unknown> {
  return {
    type: header ? "tableHeader" : "tableCell",
    content: [{ type: "paragraph", content: [adfText(text, header)] }],
  };
}

export interface WorkLogEntry {
  date: string;
  time: string;
  duration: string;
  description: string;
}

export interface NoteEntry {
  timestamp: string;
  description: string;
}

export function buildWorkLogAdf(
  issueKey: string,
  entries: WorkLogEntry[],
  notes: NoteEntry[],
  totalFormatted: string,
): Record<string, unknown>[] {
  const content: Record<string, unknown>[] = [];

  // Title
  content.push({
    type: "heading",
    attrs: { level: 3 },
    content: [adfText(`Work Log — ${issueKey}`)],
  });

  // Table
  if (entries.length > 0) {
    const headerRow = {
      type: "tableRow",
      content: [
        adfTableCell("Date", true),
        adfTableCell("Time", true),
        adfTableCell("Duration", true),
        adfTableCell("Description", true),
      ],
    };

    const dataRows = entries.map((e) => ({
      type: "tableRow",
      content: [
        adfTableCell(e.date),
        adfTableCell(e.time),
        adfTableCell(e.duration),
        adfTableCell(e.description),
      ],
    }));

    content.push({
      type: "table",
      attrs: { isNumberColumnEnabled: false, layout: "default" },
      content: [headerRow, ...dataRows],
    });
  }

  // Notes
  if (notes.length > 0) {
    content.push({
      type: "heading",
      attrs: { level: 4 },
      content: [adfText("Notes")],
    });

    content.push({
      type: "bulletList",
      content: notes.map((n) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              adfText(`[${n.timestamp}] `, true),
              adfText(n.description),
            ],
          },
        ],
      })),
    });
  }

  // Footer
  content.push({
    type: "paragraph",
    content: [
      adfText(`Total: ${totalFormatted}`, true),
      adfText(" · Generated by Worked Hours Count"),
    ],
  });

  return content;
}
