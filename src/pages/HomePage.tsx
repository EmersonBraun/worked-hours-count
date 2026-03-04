import { useState } from "react";
import RunTime from "@/components/RunTime";
import ManualEntry from "@/components/ManualEntry";

type Tab = "timer" | "manual";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("timer");

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Tab toggle */}
      <div className="mb-6 flex justify-center">
        <div className="flex gap-1 rounded bg-slate-900 p-1">
          <button
            onClick={() => setTab("timer")}
            className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "timer"
                ? "bg-cyan-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Timer
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === "manual"
                ? "bg-cyan-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Manual Entry
          </button>
        </div>
      </div>

      {tab === "timer" ? (
        <div className="flex items-center justify-center">
          <RunTime />
        </div>
      ) : (
        <ManualEntry />
      )}
    </div>
  );
}
