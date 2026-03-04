import { useState, useCallback } from "react";
import SelectJiraIssue from "./SelectJiraIssue";
import TimePicker from "./TimePicker";
import { addRun } from "@/db/database";
import { convertSeconds } from "@/utils/dateUtils";

function timeToSeconds(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 3600 + (m || 0) * 60;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ManualEntry() {
  const [issueKey, setIssueKey] = useState("");
  const [issueSummary, setIssueSummary] = useState("");
  const [date, setDate] = useState(todayStr());
  const [startAt, setStartAt] = useState("");
  const [stopAt, setStopAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleIssueChange = useCallback((key: string, summary: string) => {
    setIssueKey(key);
    setIssueSummary(summary);
  }, []);

  const seconds = startAt && stopAt ? timeToSeconds(stopAt) - timeToSeconds(startAt) : 0;
  const valid = issueKey && date && startAt && stopAt && seconds > 0;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setMessage(null);
    try {
      await addRun({
        jira_issue_key: issueKey,
        jira_issue_summary: issueSummary,
        date,
        start_at: startAt,
        stop_at: stopAt,
        seconds,
      });
      setMessage({ type: "ok", text: "Run saved successfully!" });
      setStartAt("");
      setStopAt("");
    } catch (err) {
      setMessage({ type: "err", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      <SelectJiraIssue value={issueKey} onChange={handleIssueChange} />

      <div>
        <label className="mb-1 block text-xs text-gray-400">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TimePicker label="Start At" value={startAt} onChange={setStartAt} />
        <TimePicker label="Stop At" value={stopAt} onChange={setStopAt} />
      </div>

      {seconds > 0 && (
        <div className="text-center font-mono text-lg text-cyan-400">
          {convertSeconds(seconds)}
        </div>
      )}

      {seconds < 0 && (
        <div className="text-center text-sm text-red-400">
          Stop time must be after start time
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={!valid || saving}
        className="w-full rounded bg-green-600 py-3 text-lg font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Run"}
      </button>

      {message && (
        <div className={`rounded px-3 py-2 text-center text-sm ${message.type === "ok" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
