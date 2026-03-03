import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { getCurrent } from "@tauri-apps/plugin-deep-link";
import Header from "@/components/Header";
import FooterMenu from "@/components/FooterMenu";
import HomePage from "@/pages/HomePage";
import ListPage from "@/pages/ListPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { handleOAuthCallback } from "@/jira/oauth";

export default function App() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function processUrl(url: string) {
      if (!url.startsWith("worked-hours://auth/callback")) return;
      try {
        const siteName = await handleOAuthCallback(url);
        setBanner({ type: "success", text: `Connected to ${siteName}!` });
        navigate("/settings");
      } catch (err) {
        setBanner({ type: "error", text: err instanceof Error ? err.message : "OAuth failed" });
      }
    }

    // Handle cold start (app was closed when deep link was triggered)
    getCurrent().then((urls) => {
      if (urls?.length) processUrl(urls[0]);
    });

    // Handle warm callback (app already open)
    const unlisten = onOpenUrl((urls) => {
      if (urls.length) processUrl(urls[0]);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {banner && (
        <div
          className={`px-4 py-2 text-center text-sm ${
            banner.type === "success"
              ? "bg-green-700 text-green-100"
              : "bg-red-700 text-red-100"
          }`}
        >
          {banner.text}
          <button
            onClick={() => setBanner(null)}
            className="ml-3 font-bold opacity-70 hover:opacity-100"
          >
            &times;
          </button>
        </div>
      )}
      <main className="flex-1 bg-slate-800">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <FooterMenu />
    </div>
  );
}
