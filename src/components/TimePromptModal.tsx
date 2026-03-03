import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { convertSeconds } from "@/utils/dateUtils";

interface TimePromptModalProps {
  elapsed: number;
  onSave: (text: string) => void;
  onSkip: () => void;
}

export default function TimePromptModal({ elapsed, onSave, onSkip }: TimePromptModalProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    const trimmed = text.trim();
    if (trimmed) {
      onSave(trimmed);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="mx-4 w-full max-w-md rounded-lg bg-slate-800 p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-bold text-white">What are you working on?</h3>
        <p className="mb-4 text-sm text-gray-400">
          Elapsed: <span className="font-mono text-cyan-400">{convertSeconds(elapsed)}</span>
        </p>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you're doing..."
          rows={3}
          className="mb-4 w-full resize-none rounded bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-400"
        />

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!text.trim()}
            className="flex-1 rounded bg-cyan-600 py-2 font-bold text-white transition-colors hover:bg-cyan-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={onSkip}
            className="flex-1 rounded bg-slate-600 py-2 font-bold text-white transition-colors hover:bg-slate-500"
          >
            Skip
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">Ctrl+Enter to save</p>
      </div>
    </div>,
    document.body,
  );
}
