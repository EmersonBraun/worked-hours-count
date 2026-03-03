import { useState, useEffect } from "react";
import { formatDateTime } from "@/utils/dateUtils";

export default function Clock() {
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const tick = () => setNow(formatDateTime(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono text-sm text-gray-300">{now}</span>;
}
