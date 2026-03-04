import { useState, useEffect } from "react";
import { getSetting } from "@/db/database";
import { testConnection } from "@/jira/client";
import { isJiraConfigured, saveCredentials, disconnectJira } from "@/jira/tokenManager";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [promptInterval, setPromptInterval] = useState("60");
  const [scheduledTimes, setScheduledTimes] = useState<string[]>([]);
  const [newTimeHour, setNewTimeHour] = useState("09");
  const [newTimeMinute, setNewTimeMinute] = useState("00");
  const [savingInterval, setSavingInterval] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [e, d, t, configured, interval, times] = await Promise.all([
        getSetting("jira_email"),
        getSetting("jira_domain"),
        getSetting("jira_api_token"),
        isJiraConfigured(),
        getSetting("prompt_interval_minutes"),
        getSetting("prompt_scheduled_times"),
      ]);
      if (e) setEmail(e);
      if (d) setDomain(d);
      if (t) setApiToken(t);
      setConnected(configured);
      if (interval) setPromptInterval(interval);
      if (times) {
        try { setScheduledTimes(JSON.parse(times)); } catch { /* ignore */ }
      }
    };
    load();
  }, []);

  const handleSaveAndConnect = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveCredentials(email.trim(), domain.trim(), apiToken.trim());
      const user = await testConnection();
      setConnected(true);
      setMessage({ type: "success", text: `Connected! Hello, ${user.displayName}` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Connection failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const user = await testConnection();
      setMessage({ type: "success", text: `Connected! Hello, ${user.displayName}` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Connection failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setMessage(null);
    try {
      await disconnectJira();
      setConnected(false);
      setEmail("");
      setDomain("");
      setApiToken("");
      setMessage({ type: "success", text: "Disconnected from Jira" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to disconnect" });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveTimerSettings = async () => {
    setSavingInterval(true);
    setMessage(null);
    try {
      const { setSetting } = await import("@/db/database");
      await setSetting("prompt_interval_minutes", promptInterval);
      await setSetting("prompt_scheduled_times", JSON.stringify(scheduledTimes));
      setMessage({ type: "success", text: "Timer settings saved!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSavingInterval(false);
    }
  };

  const handleAddTime = () => {
    const time = `${newTimeHour}:${newTimeMinute}`;
    if (scheduledTimes.includes(time)) return;
    setScheduledTimes((prev) => [...prev, time].sort());
  };

  const handleRemoveTime = (time: string) => {
    setScheduledTimes((prev) => prev.filter((t) => t !== time));
  };

  const canSave = email.trim() && domain.trim() && apiToken.trim();

  const [jiraOpen, setJiraOpen] = useState(true);
  const [timerOpen, setTimerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">Settings</h2>

      <div className="space-y-3">
        {/* Jira Connection — collapsible */}
        <section className="rounded-lg bg-slate-800 overflow-hidden">
          <button
            onClick={() => setJiraOpen(!jiraOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-750 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${jiraOpen ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Jira Connection</h3>
            </div>
            {connected && (
              <span className="rounded-full bg-green-900/50 px-2 py-0.5 text-xs text-green-400">Connected</span>
            )}
          </button>

          {jiraOpen && (
            <div className="border-t border-slate-700 px-4 py-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Email</label>
                <input
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Jira Domain</label>
                <input
                  type="text"
                  placeholder="yourcompany.atlassian.net"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">API Token</label>
                <input
                  type="password"
                  placeholder="Your Jira API token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Create a token at{" "}
                  <a
                    href="https://id.atlassian.com/manage-profile/security/api-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline hover:text-cyan-300"
                  >
                    Atlassian API Tokens
                  </a>
                </p>
              </div>
              <button
                onClick={handleSaveAndConnect}
                disabled={saving || !canSave}
                className="w-full rounded bg-cyan-600 py-2 font-bold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
              >
                {saving ? "Connecting..." : "Save & Connect"}
              </button>

              {connected && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex-1 rounded bg-slate-600 py-2 font-bold text-white transition-colors hover:bg-slate-500 disabled:opacity-50"
                  >
                    {testing ? "Testing..." : "Test Connection"}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex-1 rounded bg-red-700 py-2 font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                  >
                    {disconnecting ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Timer Settings — collapsible */}
        <section className="rounded-lg bg-slate-800 overflow-hidden">
          <button
            onClick={() => setTimerOpen(!timerOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-750 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg
                className={`h-4 w-4 text-gray-400 transition-transform ${timerOpen ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Timer Settings</h3>
            </div>
            <span className="font-mono text-xs text-gray-500">{promptInterval} min</span>
          </button>

          {timerOpen && (
            <div className="border-t border-slate-700 px-4 py-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-400">
                  Prompt interval (minutes) — 0 to disable
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={promptInterval}
                  onChange={(e) => setPromptInterval(e.target.value)}
                  className="w-full rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-gray-400">
                  Scheduled prompt times
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={newTimeHour}
                    onChange={(e) => setNewTimeHour(e.target.value)}
                    className="appearance-none rounded bg-slate-700 px-3 py-2 text-center text-white outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-lg font-bold text-gray-400">:</span>
                  <select
                    value={newTimeMinute}
                    onChange={(e) => setNewTimeMinute(e.target.value)}
                    className="appearance-none rounded bg-slate-700 px-3 py-2 text-center text-white outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddTime}
                    className="rounded bg-cyan-600 px-3 py-2 text-sm font-bold text-white hover:bg-cyan-700"
                  >
                    Add
                  </button>
                </div>
                {scheduledTimes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {scheduledTimes.map((time) => (
                      <span
                        key={time}
                        className="flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1 text-sm font-mono text-cyan-400"
                      >
                        {time}
                        <button
                          onClick={() => handleRemoveTime(time)}
                          className="text-gray-500 hover:text-red-400"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  The prompt will trigger at these specific times while the timer is running.
                </p>
              </div>

              <button
                onClick={handleSaveTimerSettings}
                disabled={savingInterval}
                className="w-full rounded bg-cyan-600 py-2 font-bold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
              >
                {savingInterval ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </section>

        {message && (
          <div
            className={`rounded px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-900/50 text-green-300"
                : "bg-red-900/50 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
