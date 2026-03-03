import { useState, useEffect } from "react";
import { getSetting, setSetting } from "@/db/database";
import { testConnection } from "@/jira/client";
import { isOAuthConfigured } from "@/jira/tokenManager";
import { startOAuthFlow, disconnectOAuth } from "@/jira/oauth";

export default function SettingsPage() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [promptInterval, setPromptInterval] = useState("60");
  const [savingInterval, setSavingInterval] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [cId, cSecret, site, configured, interval] = await Promise.all([
        getSetting("oauth_client_id"),
        getSetting("oauth_client_secret"),
        getSetting("oauth_site_name"),
        isOAuthConfigured(),
        getSetting("prompt_interval_minutes"),
      ]);
      if (cId) setClientId(cId);
      if (cSecret) setClientSecret(cSecret);
      if (site) setSiteName(site);
      setConnected(configured);
      if (interval) setPromptInterval(interval);
    };
    load();
  }, []);

  const handleSaveCredentials = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setSetting("oauth_client_id", clientId.trim());
      await setSetting("oauth_client_secret", clientSecret.trim());
      setMessage({ type: "success", text: "OAuth credentials saved!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setMessage(null);
    try {
      await startOAuthFlow();
      setMessage({ type: "success", text: "Browser opened. Complete authorization there." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to start OAuth" });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setMessage(null);
    try {
      await disconnectOAuth();
      setConnected(false);
      setSiteName("");
      setMessage({ type: "success", text: "Disconnected from Jira" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to disconnect" });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveInterval = async () => {
    setSavingInterval(true);
    setMessage(null);
    try {
      await setSetting("prompt_interval_minutes", promptInterval);
      setMessage({ type: "success", text: "Prompt interval saved!" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSavingInterval(false);
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

  return (
    <div className="mx-auto max-w-lg p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">Jira Settings</h2>

      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">OAuth App Credentials</h3>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Client ID</label>
              <input
                type="text"
                placeholder="Your OAuth app Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Client Secret</label>
              <input
                type="password"
                placeholder="Your OAuth app Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <button
              onClick={handleSaveCredentials}
              disabled={saving || !clientId || !clientSecret}
              className="w-full rounded bg-cyan-600 py-2 font-bold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </section>

        <hr className="border-slate-600" />

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Jira Connection</h3>
          {connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded bg-green-900/30 px-4 py-3 text-sm text-green-300">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Connected to {siteName || "Jira"}
              </div>
              <div className="flex gap-3">
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
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting || !clientId || !clientSecret}
              className="w-full rounded bg-blue-600 py-2 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {connecting ? "Opening browser..." : "Connect to Jira"}
            </button>
          )}
        </section>

        <hr className="border-slate-600" />

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Timer Settings</h3>
          <div className="space-y-3">
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
            <button
              onClick={handleSaveInterval}
              disabled={savingInterval}
              className="w-full rounded bg-cyan-600 py-2 font-bold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
            >
              {savingInterval ? "Saving..." : "Save Interval"}
            </button>
          </div>
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
