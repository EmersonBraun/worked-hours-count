import Clock from "./Clock";

export default function Header() {
  return (
    <header className="flex items-center justify-between bg-slate-900 px-4 py-3">
      <div className="flex items-center gap-3">
        <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-lg font-bold text-white">Worked Hours Count</h1>
      </div>
      <Clock />
    </header>
  );
}
