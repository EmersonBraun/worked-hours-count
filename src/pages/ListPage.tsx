import { useState, useEffect, useCallback } from "react";
import {
  getRuns,
  deleteRun,
  markRunSynced,
  getRunDescriptions,
  updateRunDescription,
  deleteRunDescription,
  type RunRecord,
  type RunDescriptionRecord,
} from "@/db/database";
import { addWorklog } from "@/jira/client";
import { convertSeconds } from "@/utils/dateUtils";
import { exportCsv } from "@/utils/csv";

function buildComment(descriptions: RunDescriptionRecord[]): string | undefined {
  if (descriptions.length === 0) return undefined;
  return descriptions.map((d) => `[${d.recorded_at}] ${d.description}`).join("\n");
}

export default function ListPage() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [descriptionsMap, setDescriptionsMap] = useState<Map<number, RunDescriptionRecord[]>>(new Map());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [editingDesc, setEditingDesc] = useState<{ id: number; text: string } | null>(null);

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
  }, [startDate, endDate]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this run?")) return;
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

  const handleDescUpdate = async (id: number, text: string) => {
    await updateRunDescription(id, text);
    setEditingDesc(null);
    await loadRuns();
  };

  const handleDescDelete = async (id: number) => {
    await deleteRunDescription(id);
    await loadRuns();
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const totalSeconds = runs.reduce((acc, r) => acc + r.seconds, 0);
  const totalFormatted = convertSeconds(totalSeconds);
  const unsyncedCount = runs.filter((r) => !r.worklog_synced).length;

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
    await exportCsv(columns, rows, "worked-hours-export.csv");
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">Run History</h2>

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
      </div>

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
                        title="Delete"
                        className="text-gray-400 transition-colors hover:text-red-400"
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
                                    onChange={(e) => setEditingDesc({ id: d.id, text: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleDescUpdate(d.id, editingDesc.text);
                                      if (e.key === "Escape") setEditingDesc(null);
                                    }}
                                    className="flex-1 rounded bg-slate-600 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-cyan-400"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleDescUpdate(d.id, editingDesc.text)}
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
                                    onClick={() => setEditingDesc({ id: d.id, text: d.description })}
                                    className="text-xs text-gray-500 hover:text-cyan-400"
                                    title="Edit"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDescDelete(d.id)}
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
    </div>
  );
}
