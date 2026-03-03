import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-6xl">:(</p>
      <p className="text-xl text-gray-400">Sorry, nothing here...</p>
      <Link
        to="/"
        className="rounded bg-cyan-600 px-6 py-2 font-bold text-white hover:bg-cyan-700"
      >
        Go back
      </Link>
    </div>
  );
}
