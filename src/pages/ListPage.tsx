import { useState, useEffect, useCallback, useMemo } from "react";
import { ask } from "@tauri-apps/plugin-dialog";
import {
  getRuns,
  deleteRun,
  markRunSynced,
  getRunDescriptions,
  updateRunDescription,
  deleteRunDescription,
  getAllIssueNotes,
  updateIssueNote,
  deleteIssueNote,
  type RunRecord,
  type RunDescriptionRecord,
  type IssueNoteRecord,
} from "@/db/database";
import { addWorklog, addComment, buildWorkLogAdf, type WorkLogEntry, type NoteEntry } from "@/jira/client";
import { convertSeconds } from "@/utils/dateUtils";
import { exportCsv } from "@/utils/csv";
import CalendarView from "@/components/CalendarView";

type ViewMode = "by-run" | "by-issue" | "calendar";

interface IssueGroup {
  issueKey: string;
  summary: string;
  totalSeconds: number;
  runs: RunRecord[];
  timeline: TimelineEntry[];
  unsyncedRuns: RunRecord[];
}

interface TimelineEntry {
  type: "run" | "note";
  sortKey: string;
  run?: RunRecord;
  runDescs?: RunDescriptionRecord[];
  note?: IssueNoteRecord;
}

function buildComment(descriptions: RunDescriptionRecord[]): string | undefined {
  if (descriptions.length === 0) return undefined;
  return descriptions.map((d) => `[${d.recorded_at}] ${d.description}`).join("\n");
}

export default function ListPage() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [descriptionsMap, setDescriptionsMap] = useState<Map<number, RunDescriptionRecord[]>>(new Map());
  const [issueNotes, setIssueNotes] = useState<IssueNoteRecord[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [editingDesc, setEditingDesc] = useState<{ id: number; text: string; type: "run" | "note" } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("by-run");
  const [sendingNotes, setSendingNotes] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    const result = await getRuns(
      startDate || undefined,
      endDate || undefined,
    );
    setRuns(result);

    const map = new Map<number, RunDescriptionRecord[]>();
    await Promise.all(
      result.map(async (r) => {
        const descs = await getRunDescriptions(r.id);
        if (descs.length > 0) map.set(r.id, descs);
      }),
    );
    setDescriptionsMap(map);

    const notes = await getAllIssueNotes();
    setIssueNotes(notes);
  }, [startDate, endDate]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleDelete = async (id: number) => {
    const confirmed = await ask("Are you sure you want to delete this run?", {
      title: "Confirm Delete",
      kind: "warning",
    });
    if (!confirmed) return;
    await deleteRun(id);
    loadRuns();
  };

  const handleSync = async (run: RunRecord) => {
    setSyncingId(run.id);
    try {
      const comment = buildComment(descriptionsMap.get(run.id) || []);
      await addWorklog(run.jira_issue_key, run.date, run.seconds, comment);
      await markRunSynced(run.id);
      await loadRuns();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncAll = async () => {
    const unsynced = runs.filter((r) => !r.worklog_synced);
    if (unsynced.length === 0) return;
    setSyncingAll(true);
    try {
      for (const run of unsynced) {
        const comment = buildComment(descriptionsMap.get(run.id) || []);
        await addWorklog(run.jira_issue_key, run.date, run.seconds, comment);
        await markRunSynced(run.id);
      }
      await loadRuns();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync failed");
      await loadRuns();
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncIssueRuns = async (issueRuns: RunRecord[]) => {
    const unsynced = issueRuns.filter((r) => !r.worklog_synced);
    if (unsynced.length === 0) return;
    setSyncingAll(true);
    try {
      for (const run of unsynced) {
        const comment = buildComment(descriptionsMap.get(run.id) || []);
        await addWorklog(run.jira_issue_key, run.date, run.seconds, comment);
        await markRunSynced(run.id);
      }
      await loadRuns();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync failed");
      await loadRuns();
    } finally {
      setSyncingAll(false);
    }
  };

  const handleDescUpdate = async (id: number, text: string, type: "run" | "note") => {
    if (type === "run") {
      await updateRunDescription(id, text);
    } else {
      await updateIssueNote(id, text);
    }
    setEditingDesc(null);
    await loadRuns();
  };

  const handleDescDelete = async (id: number, type: "run" | "note") => {
    if (type === "run") {
      await deleteRunDescription(id);
    } else {
      await deleteIssueNote(id);
    }
    await loadRuns();
  };

  const handleSendNotesForIssue = async (issueKey: string, issueRunNotes: IssueNoteRecord[]) => {
    const issueRuns = runs.filter((r) => r.jira_issue_key === issueKey);
    if (issueRunNotes.length === 0 && issueRuns.length === 0) return;

    const confirmed = await ask(
      `Send work log (${issueRuns.length} run${issueRuns.length !== 1 ? "s" : ""}, ${issueRunNotes.length} note${issueRunNotes.length !== 1 ? "s" : ""}) as a comment to ${issueKey}?`,
      { title: "Send Work Log to Jira", kind: "info" },
    );
    if (!confirmed) return;

    setSendingNotes(issueKey);
    try {
      const entries: WorkLogEntry[] = issueRuns.map((r) => {
        const descs = descriptionsMap.get(r.id) || [];
        return {
          date: r.date,
          time: `${r.start_at} — ${r.stop_at}`,
          duration: convertSeconds(r.seconds),
          description: descs.map((d) => d.description).join("; ") || "—",
        };
      });

      const noteEntries: NoteEntry[] = issueRunNotes.map((n) => ({
        timestamp: n.recorded_at,
        description: n.description,
      }));

      const totalSecs = issueRuns.reduce((acc, r) => acc + r.seconds, 0);
      const adf = buildWorkLogAdf(issueKey, entries, noteEntries, convertSeconds(totalSecs));
      await addComment(issueKey, adf);
      alert("Work log sent successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send work log");
    } finally {
      setSendingNotes(null);
    }
  };

  // Uncomment to re-enable "Send Notes" in By Issue view
  // const handleSendNotes = async (group: IssueGroup) => {
  //   const notes = group.timeline
  //     .filter((e) => e.type === "note" && e.note)
  //     .map((e) => e.note!);
  //   await handleSendNotesForIssue(group.issueKey, notes);
  // };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const totalSeconds = runs.reduce((acc, r) => acc + r.seconds, 0);
  const totalFormatted = convertSeconds(totalSeconds);
  const unsyncedCount = runs.filter((r) => !r.worklog_synced).length;

  // Group notes by issue key for use in By Run and Calendar views
  const notesByIssue = useMemo(() => {
    const map = new Map<string, IssueNoteRecord[]>();
    for (const n of issueNotes) {
      const list = map.get(n.jira_issue_key) || [];
      list.push(n);
      map.set(n.jira_issue_key, list);
    }
    return map;
  }, [issueNotes]);

  const handleExport = async () => {
    const columns = ["Issue", "Summary", "Date", "Start At", "Stop At", "Run Time", "Synced", "Descriptions"];
    const rows = runs.map((r) => {
      const descs = descriptionsMap.get(r.id) || [];
      const descText = descs.map((d) => `[${d.recorded_at}] ${d.description}`).join(" | ");
      return [
        r.jira_issue_key,
        r.jira_issue_summary,
        r.date,
        r.start_at,
        r.stop_at,
        convertSeconds(r.seconds),
        r.worklog_synced ? "Yes" : "No",
        descText,
      ];
    });
    const parts = ["worked-hours-export"];
    if (startDate) parts.push(startDate);
    if (endDate) parts.push(endDate);
    await exportCsv(columns, rows, `${parts.join("_")}.csv`);
  };

  // Build issue groups for By Issue view
  const issueGroups: IssueGroup[] = (() => {
    if (viewMode !== "by-issue") return [];

    const groupMap = new Map<string, IssueGroup>();

    for (const r of runs) {
      let group = groupMap.get(r.jira_issue_key);
      if (!group) {
        group = {
          issueKey: r.jira_issue_key,
          summary: r.jira_issue_summary,
          totalSeconds: 0,
          runs: [],
          timeline: [],
          unsyncedRuns: [],
        };
        groupMap.set(r.jira_issue_key, group);
      }
      group.totalSeconds += r.seconds;
      group.runs.push(r);
      if (!r.worklog_synced) group.unsyncedRuns.push(r);

      const descs = descriptionsMap.get(r.id) || [];
      group.timeline.push({
        type: "run",
        sortKey: `${r.date} ${r.start_at}`,
        run: r,
        runDescs: descs,
      });
    }

    for (const note of issueNotes) {
      let group = groupMap.get(note.jira_issue_key);
      if (!group) {
        group = {
          issueKey: note.jira_issue_key,
          summary: "",
          totalSeconds: 0,
          runs: [],
          timeline: [],
          unsyncedRuns: [],
        };
        groupMap.set(note.jira_issue_key, group);
      }
      group.timeline.push({
        type: "note",
        sortKey: note.recorded_at,
        note,
      });
    }

    const groups = Array.from(groupMap.values());
    for (const g of groups) {
      g.timeline.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }
    groups.sort((a, b) => b.totalSeconds - a.totalSeconds);

    return groups;
  })();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">Run History</h2>

      {viewMode !== "calendar" && (
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <button
            onClick={clearFilter}
            className="rounded bg-slate-600 px-4 py-2 text-white hover:bg-slate-500"
          >
            Clear
          </button>
          <button
            onClick={handleExport}
            className="rounded bg-cyan-600 px-4 py-2 font-bold text-white hover:bg-cyan-700"
          >
            Export CSV
          </button>
          {unsyncedCount > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="rounded bg-green-600 px-4 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {syncingAll ? "Syncing..." : `Sync All (${unsyncedCount})`}
            </button>
          )}
          {/* {issueNotes.length > 0 && (
            <div className="flex items-center gap-2">
              {Array.from(notesByIssue.entries()).map(([issueKey, notes]) => (
                <button
                  key={issueKey}
                  onClick={() => handleSendNotesForIssue(issueKey, notes)}
                  disabled={sendingNotes === issueKey}
                  className="rounded bg-purple-600 px-4 py-2 font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {sendingNotes === issueKey ? "Sending..." : `Send Notes ${issueKey} (${notes.length})`}
                </button>
              ))}
            </div>
          )} */}
        </div>
      )}

      {/* View mode toggle */}
      <div className="mb-4 flex gap-1 rounded bg-slate-900 p-1 w-fit">
        <button
          onClick={() => setViewMode("by-run")}
          className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            viewMode === "by-run"
              ? "bg-cyan-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          By Run
        </button>
        <button
          onClick={() => setViewMode("by-issue")}
          className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            viewMode === "by-issue"
              ? "bg-cyan-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          By Issue
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`flex items-center gap-1.5 rounded px-4 py-1.5 text-sm font-medium transition-colors ${
            viewMode === "calendar"
              ? "bg-cyan-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendar
        </button>
      </div>

      {viewMode === "calendar" ? (
        <CalendarView
          runs={runs}
          descriptionsMap={descriptionsMap}
          syncingId={syncingId}
          onSync={handleSync}
          onDelete={handleDelete}
          notesByIssue={notesByIssue}
          sendingNotes={sendingNotes}
          onSendNotes={handleSendNotesForIssue}
        />
      ) : viewMode === "by-run" ? (
        /* ===== BY RUN VIEW ===== */
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-gray-300">
              <tr>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Start At</th>
                <th className="px-4 py-3">Stop At</th>
                <th className="px-4 py-3">Run Time</th>
                <th className="px-4 py-3">Synced</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {runs.map((r) => {
                const descs = descriptionsMap.get(r.id) || [];
                const isExpanded = expandedRun === r.id;
                return (
                  <>
                    <tr key={r.id} className="bg-slate-800 hover:bg-slate-750">
                      <td className="px-4 py-3 text-white" title={r.jira_issue_summary}>
                        {r.jira_issue_key}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{r.date}</td>
                      <td className="px-4 py-3 text-gray-300">{r.start_at}</td>
                      <td className="px-4 py-3 text-gray-300">{r.stop_at}</td>
                      <td className="px-4 py-3 font-mono text-cyan-400">
                        {convertSeconds(r.seconds)}
                      </td>
                      <td className="px-4 py-3">
                        {r.worklog_synced ? (
                          <span className="text-green-400">Yes</span>
                        ) : (
                          <button
                            onClick={() => handleSync(r)}
                            disabled={syncingId === r.id}
                            className="rounded bg-green-700 px-2 py-1 text-xs text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            {syncingId === r.id ? "..." : "Sync"}
                          </button>
                        )}
                      </td>
                      <td className="flex items-center gap-2 px-4 py-3">
                        {descs.length > 0 && (
                          <button
                            onClick={() => setExpandedRun(isExpanded ? null : r.id)}
                            title="View notes"
                            className="relative text-gray-400 transition-colors hover:text-cyan-400"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
                              {descs.length}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={!!r.worklog_synced}
                          title={r.worklog_synced ? "Cannot delete synced run" : "Delete"}
                          className={`transition-colors ${r.worklog_synced ? "cursor-not-allowed text-gray-600" : "text-gray-400 hover:text-red-400"}`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.id}-desc`} className="bg-slate-850">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="space-y-2">
                            {descs.map((d) => (
                              <div key={d.id} className="flex items-start gap-3 rounded bg-slate-700/50 px-3 py-2 text-sm">
                                <span className="shrink-0 font-mono text-xs text-gray-500">{d.recorded_at}</span>
                                {editingDesc?.id === d.id ? (
                                  <div className="flex flex-1 gap-2">
                                    <input
                                      type="text"
                                      value={editingDesc.text}
                                      onChange={(e) => setEditingDesc({ id: d.id, text: e.target.value, type: "run" })}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleDescUpdate(d.id, editingDesc.text, "run");
                                        if (e.key === "Escape") setEditingDesc(null);
                                      }}
                                      className="flex-1 rounded bg-slate-600 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-cyan-400"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleDescUpdate(d.id, editingDesc.text, "run")}
                                      className="text-xs text-green-400 hover:text-green-300"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingDesc(null)}
                                      className="text-xs text-gray-400 hover:text-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="flex-1 text-gray-300">{d.description}</span>
                                    <button
                                      onClick={() => setEditingDesc({ id: d.id, text: d.description, type: "run" })}
                                      className="text-xs text-gray-500 hover:text-cyan-400"
                                      title="Edit"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDescDelete(d.id, "run")}
                                      className="text-xs text-gray-500 hover:text-red-400"
                                      title="Delete"
                                    >
                                      Del
                                    </button>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No runs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
            {runs.length > 0 && (
              <tfoot className="bg-slate-900">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-bold text-white">
                    Total:
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-cyan-400">
                    {totalFormatted}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        /* ===== BY ISSUE VIEW ===== */
        <div className="space-y-3">
          {issueGroups.length === 0 && (
            <p className="py-8 text-center text-gray-400">No data recorded yet.</p>
          )}
          {issueGroups.map((group) => {
            const isExpanded = expandedIssue === group.issueKey;
            return (
              <div key={group.issueKey} className="rounded-lg bg-slate-800 overflow-hidden">
                {/* Issue header */}
                <button
                  onClick={() => setExpandedIssue(isExpanded ? null : group.issueKey)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-bold text-white">{group.issueKey}</span>
                    {group.summary && (
                      <span className="text-sm text-gray-400">{group.summary}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                      {group.runs.length} run{group.runs.length !== 1 ? "s" : ""}
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      {convertSeconds(group.totalSeconds)}
                    </span>
                  </div>
                </button>

                {/* Expanded timeline */}
                {isExpanded && (
                  <div className="border-t border-slate-700 px-4 py-3">
                    {(group.unsyncedRuns.length > 0 || group.timeline.some((e) => e.type === "note")) && (
                      <div className="mb-3 flex gap-2">
                        {group.unsyncedRuns.length > 0 && (
                          <button
                            onClick={() => handleSyncIssueRuns(group.runs)}
                            disabled={syncingAll}
                            className="rounded bg-green-700 px-3 py-1 text-xs font-bold text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            {syncingAll ? "Syncing..." : `Sync ${group.unsyncedRuns.length} unsynced run${group.unsyncedRuns.length !== 1 ? "s" : ""}`}
                          </button>
                        )}
                        {/* {group.timeline.some((e) => e.type === "note") && (
                          <button
                            onClick={() => handleSendNotes(group)}
                            disabled={sendingNotes === group.issueKey}
                            className="rounded bg-purple-700 px-3 py-1 text-xs font-bold text-white hover:bg-purple-600 disabled:opacity-50"
                          >
                            {sendingNotes === group.issueKey ? "Sending..." : "Send Notes to Jira"}
                          </button>
                        )} */}
                      </div>
                    )}
                    {/* Runs */}
                    <div className="space-y-2">
                      {group.timeline
                        .filter((e) => e.type === "run" && e.run)
                        .map((entry) => {
                          const r = entry.run!;
                          return (
                            <div key={`run-${r.id}`} className="rounded bg-slate-700/50 px-3 py-2">
                              <div className="flex items-center gap-3 text-sm">
                                <span className="rounded bg-slate-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-cyan-400">Run</span>
                                <span className="font-mono text-xs text-gray-500">{r.date} {r.start_at} - {r.stop_at}</span>
                                <span className="font-mono text-cyan-400">{convertSeconds(r.seconds)}</span>
                                {r.worklog_synced ? (
                                  <span className="text-xs text-green-400">Synced</span>
                                ) : (
                                  <span className="text-xs text-yellow-400">Not synced</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Notes */}
                    {group.timeline.some((e) => e.type === "note") && (
                      <div className="mt-3 space-y-2">
                        <span className="text-xs font-bold uppercase text-gray-500">Notes</span>
                        {group.timeline
                          .filter((e) => e.type === "note" && e.note)
                          .map((entry) => {
                            const n = entry.note!;
                            return (
                              <div key={`note-${n.id}`} className="flex items-start gap-3 rounded bg-slate-700/30 px-3 py-2 text-sm">
                                <span className="rounded bg-slate-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-400">Note</span>
                                <span className="shrink-0 font-mono text-xs text-gray-500">{n.recorded_at}</span>
                                {editingDesc?.id === n.id && editingDesc.type === "note" ? (
                                  <div className="flex flex-1 gap-2">
                                    <input
                                      type="text"
                                      value={editingDesc.text}
                                      onChange={(e) => setEditingDesc({ id: n.id, text: e.target.value, type: "note" })}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleDescUpdate(n.id, editingDesc.text, "note");
                                        if (e.key === "Escape") setEditingDesc(null);
                                      }}
                                      className="flex-1 rounded bg-slate-600 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-cyan-400"
                                      autoFocus
                                    />
                                    <button onClick={() => handleDescUpdate(n.id, editingDesc.text, "note")} className="text-xs text-green-400">Save</button>
                                    <button onClick={() => setEditingDesc(null)} className="text-xs text-gray-400">Cancel</button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="flex-1 text-gray-300">{n.description}</span>
                                    <button onClick={() => setEditingDesc({ id: n.id, text: n.description, type: "note" })} className="text-xs text-gray-500 hover:text-cyan-400">Edit</button>
                                    <button onClick={() => handleDescDelete(n.id, "note")} className="text-xs text-gray-500 hover:text-red-400">Del</button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Total footer for By Issue view */}
          {issueGroups.length > 0 && (
            <div className="flex justify-end rounded-lg bg-slate-900 px-4 py-3">
              <span className="mr-4 font-bold text-white">Total:</span>
              <span className="font-mono font-bold text-cyan-400">{totalFormatted}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
