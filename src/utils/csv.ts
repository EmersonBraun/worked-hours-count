import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

export function wrapCsvValue(val: string): string {
  let formatted = val.replace(/"/g, '""');
  if (formatted.includes(",") || formatted.includes('"') || formatted.includes("\n")) {
    formatted = `"${formatted}"`;
  }
  return formatted;
}

export async function exportCsv(columns: string[], rows: string[][], defaultName: string) {
  const header = columns.map(wrapCsvValue).join(",");
  const body = rows.map((row) => row.map(wrapCsvValue).join(",")).join("\n");
  const csv = `${header}\n${body}`;

  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });

  if (path) {
    await writeTextFile(path, csv);
  }
}
