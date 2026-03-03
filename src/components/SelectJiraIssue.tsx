import { useEffect, useState, useCallback } from "react";
import { getAssignedIssues, type JiraIssue } from "@/jira/client";
import { isOAuthConfigured } from "@/jira/tokenManager";

interface Props {
  value: string;
  onChange: (key: string, summary: string) => void;
  disabled?: boolean;
}

export default function SelectJiraIssue({ value, onChange, disabled }: Props) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(true);

  const loadIssues = useCallback(async () => {
    const hasOAuth = await isOAuthConfigured();
    if (!hasOAuth) {
      setConfigured(false);
      return;
    }
    setConfigured(true);
    setLoading(true);
    setError("");
    try {
      const result = await getAssignedIssues();
      setIssues(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    const issue = issues.find((i) => i.key === key);
    onChange(key, issue?.summary ?? "");
  };

  const placeholder = !configured
    ? "CONFIGURE JIRA FIRST"
    : loading
      ? "Loading issues..."
      : error
        ? "Error loading issues"
        : issues.length === 0
          ? "No issues found"
          : "Select an issue";

  return (
    <div className="flex gap-2">
      <select
        className="flex-1 rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
        value={value}
        onChange={handleChange}
        disabled={disabled || !configured || loading || issues.length === 0}
      >
        <option value="">{placeholder}</option>
        {issues.map((issue) => (
          <option key={issue.key} value={issue.key}>
            {issue.key} - {issue.summary}
          </option>
        ))}
      </select>
      <button
        onClick={loadIssues}
        disabled={disabled || !configured || loading}
        title="Refresh issues"
        className="rounded bg-slate-600 px-3 py-2 text-gray-300 transition-colors hover:bg-slate-500 disabled:opacity-50"
      >
        <svg className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      {error && <span className="self-center text-xs text-red-400">{error}</span>}
    </div>
  );
}
