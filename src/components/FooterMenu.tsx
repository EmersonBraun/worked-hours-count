import { Link, useLocation } from "react-router-dom";

const tabs = [
  { label: "Principal", href: "/", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "List", href: "/list", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { label: "Settings", href: "/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

export default function FooterMenu() {
  const { pathname } = useLocation();

  return (
    <nav className="flex items-center justify-around bg-slate-900 border-t border-slate-700">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            to={tab.href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
              active ? "text-cyan-400" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
