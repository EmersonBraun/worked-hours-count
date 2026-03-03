function formatTwoDigit(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function convertSeconds(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const min = Math.floor((sec - hrs * 3600) / 60);
  let seconds = sec - hrs * 3600 - min * 60;
  seconds = Math.round(seconds * 100) / 100;
  return `${formatTwoDigit(hrs)}:${formatTwoDigit(min)}:${formatTwoDigit(seconds)}`;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = formatTwoDigit(date.getMonth() + 1);
  const d = formatTwoDigit(date.getDate());
  return `${y}-${m}-${d}`;
}

export function formatTime(date: Date): string {
  const h = formatTwoDigit(date.getHours());
  const m = formatTwoDigit(date.getMinutes());
  const s = formatTwoDigit(date.getSeconds());
  return `${h}:${m}:${s}`;
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}
