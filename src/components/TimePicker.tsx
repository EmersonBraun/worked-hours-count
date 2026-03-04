import { useMemo } from "react";

interface TimePickerProps {
  value: string; // "HH:MM" or ""
  onChange: (value: string) => void;
  label: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const { hour, minute } = useMemo(() => {
    if (!value) return { hour: "", minute: "" };
    const [h, m] = value.split(":");
    return { hour: h, minute: m };
  }, [value]);

  const update = (h: string, m: string) => {
    if (h && m) onChange(`${h}:${m}`);
    else onChange("");
  };

  return (
    <div>
      <label className="mb-1 block text-xs text-gray-400">{label}</label>
      <div className="flex items-center gap-1">
        <select
          value={hour}
          onChange={(e) => update(e.target.value, minute || "00")}
          className="flex-1 appearance-none rounded bg-slate-700 px-3 py-2 text-center text-white outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <option value="" disabled>HH</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-lg font-bold text-gray-400">:</span>
        <select
          value={minute}
          onChange={(e) => update(hour || "00", e.target.value)}
          className="flex-1 appearance-none rounded bg-slate-700 px-3 py-2 text-center text-white outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <option value="" disabled>MM</option>
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
