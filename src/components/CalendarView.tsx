import { useState, useMemo } from "react";
import { convertSeconds } from "@/utils/dateUtils";
import type { RunRecord, RunDescriptionRecord, IssueNoteRecord } from "@/db/database";

interface CalendarViewProps {
  runs: RunRecord[];
  descriptionsMap: Map<number, RunDescriptionRecord[]>;
  syncingId: number | null;
  onSync: (run: RunRecord) => void;
  onDelete: (id: number) => void;
  notesByIssue: Map<string, IssueNoteRecord[]>;
  sendingNotes: string | null;
  onSendNotes: (issueKey: string, notes: IssueNoteRecord[]) => void;
}

interface DayData {
  totalSeconds: number;
  runs: RunRecord[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateStr(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function formatHoursMinutes(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  return `${hrs}:${String(min).padStart(2, "0")}`;
}

export default function CalendarView(props: CalendarViewProps) {
  const { runs, descriptionsMap, syncingId, onSync, onDelete } = props;
  // Send Notes props (notesByIssue, sendingNotes, onSendNotes) available via props — uncomment JSX below to re-enable
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const runsByDate = useMemo(() => {
    const map = new Map<string, DayData>();
    for (const r of runs) {
      const existing = map.get(r.date);
      if (existing) {
        existing.totalSeconds += r.seconds;
        existing.runs.push(r);
      } else {
        map.set(r.date, { totalSeconds: r.seconds, runs: [r] });
      }
    }
    return map;
  }, [runs]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(null);
  };

  const selectedDayData = selectedDay ? runsByDate.get(selectedDay) : null;

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    let total = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(year, month, d);
      const dayData = runsByDate.get(dateStr);
      if (dayData) total += dayData.totalSeconds;
    }
    return total;
  }, [runsByDate, year, month, daysInMonth]);

  return (
    <div>
      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded bg-slate-700 px-3 py-1.5 text-white hover:bg-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="min-w-[200px] text-center text-lg font-bold text-white">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="rounded bg-slate-700 px-3 py-1.5 text-white hover:bg-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={goToday}
            className="ml-2 rounded bg-slate-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-slate-600 hover:text-white"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-3">
          {monthlyTotal > 0 && (
            <span className="font-mono text-sm text-cyan-400">
              Month total: {convertSeconds(monthlyTotal)}
            </span>
          )}
          {/* {Array.from(notesByIssue.entries()).map(([issueKey, notes]) => (
            <button
              key={issueKey}
              onClick={() => onSendNotes(issueKey, notes)}
              disabled={sendingNotes === issueKey}
              className="rounded bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {sendingNotes === issueKey ? "Sending..." : `Send Notes ${issueKey} (${notes.length})`}
            </button>
          ))} */}
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-20 rounded bg-slate-900/30" />;
          }

          const dateStr = formatDateStr(year, month, day);
          const dayData = runsByDate.get(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDay;
          const hasRuns = !!dayData;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              className={`flex h-20 flex-col items-start rounded p-1.5 text-left transition-colors ${
                isSelected
                  ? "bg-cyan-900/40 ring-1 ring-cyan-400"
                  : hasRuns
                    ? "bg-slate-700/60 hover:bg-slate-700"
                    : "bg-slate-800/40 hover:bg-slate-800"
              } ${isToday ? "ring-1 ring-cyan-400/60" : ""}`}
            >
              <span
                className={`text-xs font-medium ${
                  isToday
                    ? "flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-white"
                    : "text-gray-400"
                }`}
              >
                {day}
              </span>
              {hasRuns && (
                <div className="mt-auto flex w-full flex-col items-end">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {formatHoursMinutes(dayData.totalSeconds)}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {dayData.runs.length} run{dayData.runs.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="mt-4 rounded-lg bg-slate-800 p-4">
          <h4 className="mb-3 text-sm font-bold text-white">
            {selectedDay}
            {selectedDayData && (
              <span className="ml-2 font-mono text-cyan-400">
                {convertSeconds(selectedDayData.totalSeconds)}
              </span>
            )}
          </h4>
          {selectedDayData ? (
            <div className="space-y-2">
              {selectedDayData.runs.map((r) => {
                const descs = descriptionsMap.get(r.id) || [];
                return (
                  <div key={r.id} className="rounded bg-slate-700/50 px-3 py-2">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-white">{r.jira_issue_key}</span>
                      <span className="font-mono text-xs text-gray-400">
                        {r.start_at} - {r.stop_at}
                      </span>
                      <span className="font-mono text-cyan-400">
                        {convertSeconds(r.seconds)}
                      </span>
                      <span className="ml-auto flex items-center gap-2">
                        {r.worklog_synced ? (
                          <span className="text-xs text-green-400">Synced</span>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); onSync(r); }}
                            disabled={syncingId === r.id}
                            className="rounded bg-green-700 px-2 py-0.5 text-xs text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            {syncingId === r.id ? "..." : "Sync"}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                          disabled={!!r.worklog_synced}
                          title={r.worklog_synced ? "Cannot delete synced run" : "Delete"}
                          className={`transition-colors ${r.worklog_synced ? "cursor-not-allowed text-gray-600" : "text-gray-400 hover:text-red-400"}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </span>
                    </div>
                    {r.jira_issue_summary && (
                      <div className="mt-1 text-xs text-gray-500">{r.jira_issue_summary}</div>
                    )}
                    {descs.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-slate-600/50 pt-2">
                        {descs.map((d) => (
                          <div key={d.id} className="flex gap-2 text-xs">
                            <span className="font-mono text-gray-500">{d.recorded_at}</span>
                            <span className="text-gray-400">{d.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No runs on this day.</p>
          )}
        </div>
      )}
    </div>
  );
}
