import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { getAssignedIssues, type JiraIssue } from "@/jira/client";
import { isJiraConfigured } from "@/jira/tokenManager";

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
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadIssues = useCallback(async () => {
    const hasJira = await isJiraConfigured();
    if (!hasJira) {
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sync input text with selected value
  useEffect(() => {
    if (value) {
      const issue = issues.find((i) => i.key === value);
      setSearch(issue ? `${issue.key} - ${issue.summary}` : value);
    } else {
      setSearch("");
    }
  }, [value, issues]);

  // Derive available statuses from loaded issues
  const availableStatuses = useMemo(() => {
    const statuses = [...new Set(issues.map((i) => i.status))].sort();
    return statuses;
  }, [issues]);

  // Filter issues by status first, then by search
  const filtered = useMemo(() => {
    let result = issues;
    if (selectedStatuses.size > 0) {
      result = result.filter((i) => selectedStatuses.has(i.status));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (issue) =>
          issue.key.toLowerCase().includes(q) || issue.summary.toLowerCase().includes(q),
      );
    }
    return result;
  }, [issues, selectedStatuses, search]);

  const handleSelect = (issue: JiraIssue) => {
    onChange(issue.key, issue.summary);
    setSearch(`${issue.key} - ${issue.summary}`);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setOpen(true);
    setHighlightIndex(0);
    // Clear selection when user types
    if (value) onChange("", "");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[highlightIndex]) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedStatuses(new Set());
  };

  const placeholder = !configured
    ? "Configure Jira first"
    : loading
      ? "Loading issues..."
      : error
        ? "Error loading issues"
        : "Type to search issues...";

  const isDisabled = disabled || !configured || loading;
  const hasActiveFilter = selectedStatuses.size > 0;

  return (
    <div className="flex gap-2" ref={wrapperRef}>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded bg-slate-700 px-3 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50"
          placeholder={placeholder}
          value={search}
          onChange={handleInputChange}
          onFocus={() => issues.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded bg-slate-700 py-1 shadow-lg ring-1 ring-slate-600">
            {filtered.map((issue, i) => (
              <li
                key={issue.key}
                onMouseDown={() => handleSelect(issue)}
                onMouseEnter={() => setHighlightIndex(i)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === highlightIndex
                    ? "bg-cyan-600 text-white"
                    : "text-gray-200 hover:bg-slate-600"
                }`}
              >
                <span className="font-mono text-cyan-300">{issue.key}</span>
                <span className="ml-2 text-gray-300">{issue.summary}</span>
              </li>
            ))}
          </ul>
        )}
        {open && filtered.length === 0 && search && issues.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded bg-slate-700 px-3 py-2 text-sm text-gray-400 shadow-lg ring-1 ring-slate-600">
            No matching issues
          </div>
        )}
      </div>

      {/* Filter button */}
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => setFilterOpen((p) => !p)}
          disabled={isDisabled || availableStatuses.length === 0}
          title="Filter by status"
          className={`relative rounded px-3 py-2 transition-colors disabled:opacity-50 ${
            hasActiveFilter
              ? "bg-cyan-600 text-white hover:bg-cyan-500"
              : "bg-slate-600 text-gray-300 hover:bg-slate-500"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {hasActiveFilter && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {selectedStatuses.size}
            </span>
          )}
        </button>

        {filterOpen && (
          <div className="absolute right-0 z-50 mt-1 w-48 rounded bg-slate-700 py-1 shadow-lg ring-1 ring-slate-600">
            <button
              onMouseDown={(e) => { e.preventDefault(); selectAll(); }}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                !hasActiveFilter
                  ? "bg-cyan-600/20 text-cyan-400"
                  : "text-gray-300 hover:bg-slate-600"
              }`}
            >
              All
            </button>
            <div className="mx-2 border-t border-slate-600" />
            {availableStatuses.map((status) => (
              <label
                key={status}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-slate-600"
                onMouseDown={(e) => e.preventDefault()}
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.has(status)}
                  onChange={() => toggleStatus(status)}
                  className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-600 text-cyan-500 focus:ring-cyan-400"
                />
                {status}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Refresh button */}
      <button
        onClick={loadIssues}
        disabled={isDisabled}
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
