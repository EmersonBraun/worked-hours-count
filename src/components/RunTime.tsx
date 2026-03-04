import { useState, useRef, useCallback, useEffect } from "react";
import SelectJiraIssue from "./SelectJiraIssue";
import TimePromptModal from "./TimePromptModal";
import { addRun, addRunDescriptions, getSetting, addIssueNote, getIssueNotes, deleteIssueNote, updateIssueNote, type IssueNoteRecord } from "@/db/database";
import { convertSeconds, formatDate, formatTime } from "@/utils/dateUtils";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface PendingDescription {
  description: string;
  recorded_at: string;
}

export default function RunTime() {
  const [issueKey, setIssueKey] = useState("");
  const [issueSummary, setIssueSummary] = useState("");
  const [running, setRunning] = useState(false);
  const [display, setDisplay] = useState("00:00:00");
  const [startAt, setStartAt] = useState("");
  const [stopAt, setStopAt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [descriptions, setDescriptions] = useState<PendingDescription[]>([]);
  const [noteText, setNoteText] = useState("");
  const [issueNotes, setIssueNotes] = useState<IssueNoteRecord[]>([]);
  const [editingNote, setEditingNote] = useState<{ id: number; text: string } | null>(null);

  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheduledCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedTimesRef = useRef<Set<string>>(new Set());

  const loadIssueNotes = useCallback(async (key: string) => {
    if (!key) {
      setIssueNotes([]);
      return;
    }
    const notes = await getIssueNotes(key);
    setIssueNotes(notes);
  }, []);

  const handleIssueChange = useCallback((key: string, summary: string) => {
    setIssueKey(key);
    setIssueSummary(summary);
    loadIssueNotes(key);
  }, [loadIssueNotes]);

  useEffect(() => {
    if (issueKey) loadIssueNotes(issueKey);
  }, [issueKey, loadIssueNotes]);

  const getElapsedSeconds = () => {
    if (!startTimeRef.current) return 0;
    return Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
  };

  const triggerPrompt = useCallback(async () => {
    setShowPrompt(true);

    try {
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === "granted";
      }
      if (granted) {
        const elapsed = startTimeRef.current
          ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
          : 0;
        sendNotification({
          title: "What are you working on?",
          body: `Timer running: ${convertSeconds(elapsed)} on ${issueKey}`,
        });
      }
    } catch {
      // Notification not available
    }

    try {
      await getCurrentWindow().setFocus();
    } catch {
      // Window focus not available
    }
  }, [issueKey]);

  const handleStart = useCallback(async () => {
    if (!issueKey) return;
    const now = new Date();
    startTimeRef.current = now;
    setStartAt(formatTime(now));
    setStopAt("");
    setRunning(true);
    setDescriptions([]);

    intervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const elapsed = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      setDisplay(convertSeconds(elapsed));
    }, 1000);

    const [intervalStr, timesStr] = await Promise.all([
      getSetting("prompt_interval_minutes"),
      getSetting("prompt_scheduled_times"),
    ]);

    const intervalMinutes = intervalStr ? parseFloat(intervalStr) : 60;
    if (intervalMinutes > 0) {
      const intervalMs = intervalMinutes * 60 * 1000;
      promptIntervalRef.current = setInterval(() => triggerPrompt(), intervalMs);
    }

    // Scheduled times check
    let scheduledTimes: string[] = [];
    if (timesStr) {
      try { scheduledTimes = JSON.parse(timesStr); } catch { /* ignore */ }
    }
    if (scheduledTimes.length > 0) {
      firedTimesRef.current = new Set();
      scheduledCheckRef.current = setInterval(() => {
        const d = new Date();
        const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        if (scheduledTimes.includes(hhmm) && !firedTimesRef.current.has(hhmm)) {
          firedTimesRef.current.add(hhmm);
          triggerPrompt();
        }
      }, 15_000); // check every 15 seconds
    }
  }, [issueKey, triggerPrompt]);

  const handleStop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (promptIntervalRef.current) {
      clearInterval(promptIntervalRef.current);
      promptIntervalRef.current = null;
    }
    if (scheduledCheckRef.current) {
      clearInterval(scheduledCheckRef.current);
      scheduledCheckRef.current = null;
    }
    firedTimesRef.current.clear();

    const now = new Date();
    const stopTime = formatTime(now);
    setStopAt(stopTime);
    setRunning(false);
    setShowPrompt(false);

    if (startTimeRef.current) {
      const seconds = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
      const runId = await addRun({
        jira_issue_key: issueKey,
        jira_issue_summary: issueSummary,
        date: formatDate(startTimeRef.current),
        start_at: formatTime(startTimeRef.current),
        stop_at: stopTime,
        seconds,
      });
      if (descriptions.length > 0) {
        await addRunDescriptions(runId, descriptions);
      }
    }

    startTimeRef.current = null;
    setDescriptions([]);
  }, [issueKey, issueSummary, descriptions]);

  const handlePromptSave = useCallback(async (text: string) => {
    const now = new Date();
    const recordedAt = `${formatDate(now)} ${formatTime(now)}`;

    // Save to in-memory descriptions for run_descriptions
    setDescriptions((prev) => [
      ...prev,
      { description: text, recorded_at: formatTime(now) },
    ]);

    // Also save immediately as issue_note
    if (issueKey) {
      await addIssueNote(issueKey, text, recordedAt);
      await loadIssueNotes(issueKey);
    }

    setShowPrompt(false);
  }, [issueKey, loadIssueNotes]);

  const handlePromptSkip = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const handleAddNote = useCallback(async () => {
    if (!noteText.trim() || !issueKey) return;
    const now = new Date();
    const recordedAt = `${formatDate(now)} ${formatTime(now)}`;
    if (running) {
      setDescriptions((prev) => [
        ...prev,
        { description: noteText.trim(), recorded_at: formatTime(now) },
      ]);
    } else {
      await addIssueNote(issueKey, noteText.trim(), recordedAt);
      await loadIssueNotes(issueKey);
    }
    setNoteText("");
  }, [noteText, issueKey, running, loadIssueNotes]);

  const handleDeleteNote = useCallback(async (id: number) => {
    await deleteIssueNote(id);
    await loadIssueNotes(issueKey);
  }, [issueKey, loadIssueNotes]);

  const handleUpdateNote = useCallback(async (id: number, text: string) => {
    await updateIssueNote(id, text);
    setEditingNote(null);
    await loadIssueNotes(issueKey);
  }, [issueKey, loadIssueNotes]);

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div
        className="font-mono text-7xl font-bold tracking-wider text-cyan-400 sm:text-8xl md:text-9xl"
        style={{ textShadow: "0 0 20px rgba(10, 175, 230, 0.8), 0 0 40px rgba(10, 175, 230, 0.4)" }}
      >
        {display}
      </div>

      <div className="w-full max-w-md space-y-4">
        <SelectJiraIssue value={issueKey} onChange={handleIssueChange} disabled={running} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Start At</label>
            <input
              type="text"
              readOnly
              value={startAt}
              className="w-full rounded bg-slate-700 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Stop At</label>
            <input
              type="text"
              readOnly
              value={stopAt}
              className="w-full rounded bg-slate-700 px-3 py-2 text-white"
            />
          </div>
        </div>

        {!running ? (
          <button
            onClick={handleStart}
            disabled={!issueKey}
            className="w-full rounded bg-green-600 py-3 text-lg font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="w-full rounded bg-red-600 py-3 text-lg font-bold text-white transition-colors hover:bg-red-700"
          >
            Stop
          </button>
        )}

        {issueKey && (
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }}
              placeholder="Add a note..."
              className="flex-1 rounded bg-slate-700 px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim()}
              className="rounded bg-cyan-600 px-4 py-2 font-bold text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Note
            </button>
          </div>
        )}

        {running && descriptions.length > 0 && (
          <div className="rounded bg-slate-700/50 px-3 py-2 text-xs text-gray-400">
            {descriptions.length} note{descriptions.length !== 1 ? "s" : ""} recorded this session
          </div>
        )}

        {!running && issueNotes.length > 0 && (
          <div className="space-y-2 rounded bg-slate-700/50 px-3 py-2">
            <span className="text-xs font-semibold text-gray-400">Notes for {issueKey}</span>
            {issueNotes.map((n) => (
              <div key={n.id} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 font-mono text-xs text-gray-500">{n.recorded_at}</span>
                {editingNote?.id === n.id ? (
                  <div className="flex flex-1 gap-2">
                    <input
                      type="text"
                      value={editingNote.text}
                      onChange={(e) => setEditingNote({ id: n.id, text: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateNote(n.id, editingNote.text);
                        if (e.key === "Escape") setEditingNote(null);
                      }}
                      className="flex-1 rounded bg-slate-600 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-cyan-400"
                      autoFocus
                    />
                    <button onClick={() => handleUpdateNote(n.id, editingNote.text)} className="text-xs text-green-400 hover:text-green-300">Save</button>
                    <button onClick={() => setEditingNote(null)} className="text-xs text-gray-400 hover:text-gray-300">Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-gray-300">{n.description}</span>
                    <button
                      onClick={() => setEditingNote({ id: n.id, text: n.description })}
                      className="text-xs text-gray-500 hover:text-cyan-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="text-xs text-gray-500 hover:text-red-400"
                    >
                      Del
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPrompt && (
        <TimePromptModal
          elapsed={getElapsedSeconds()}
          onSave={handlePromptSave}
          onSkip={handlePromptSkip}
        />
      )}
    </div>
  );
}
