import { useState, useRef, useCallback } from "react";
import SelectJiraIssue from "./SelectJiraIssue";
import TimePromptModal from "./TimePromptModal";
import { addRun, addRunDescriptions, getSetting } from "@/db/database";
import { convertSeconds, formatDate, formatTime } from "@/utils/dateUtils";

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

  const startTimeRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleIssueChange = useCallback((key: string, summary: string) => {
    setIssueKey(key);
    setIssueSummary(summary);
  }, []);

  const getElapsedSeconds = () => {
    if (!startTimeRef.current) return 0;
    return Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
  };

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

    const intervalStr = await getSetting("prompt_interval_minutes");
    const intervalMinutes = intervalStr ? parseFloat(intervalStr) : 60;

    if (intervalMinutes > 0) {
      const intervalMs = intervalMinutes * 60 * 1000;
      promptIntervalRef.current = setInterval(() => {
        setShowPrompt(true);
      }, intervalMs);
    }
  }, [issueKey]);

  const handleStop = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (promptIntervalRef.current) {
      clearInterval(promptIntervalRef.current);
      promptIntervalRef.current = null;
    }

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

  const handlePromptSave = useCallback((text: string) => {
    setDescriptions((prev) => [
      ...prev,
      { description: text, recorded_at: formatTime(new Date()) },
    ]);
    setShowPrompt(false);
  }, []);

  const handlePromptSkip = useCallback(() => {
    setShowPrompt(false);
  }, []);

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

        {descriptions.length > 0 && (
          <div className="rounded bg-slate-700/50 px-3 py-2 text-xs text-gray-400">
            {descriptions.length} note{descriptions.length !== 1 ? "s" : ""} recorded
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
