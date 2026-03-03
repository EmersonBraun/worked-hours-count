import Database from "@tauri-apps/plugin-sql";

export interface RunRecord {
  id: number;
  jira_issue_key: string;
  jira_issue_summary: string;
  date: string;
  start_at: string;
  stop_at: string;
  seconds: number;
  worklog_synced: number;
}

export interface RunDescriptionRecord {
  id: number;
  run_id: number;
  description: string;
  recorded_at: string;
}

export interface SettingRecord {
  key: string;
  value: string;
}

let dbInstance: Database | null = null;

async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:worked_hours.db");
  }
  return dbInstance;
}

export async function addRun(run: Omit<RunRecord, "id" | "worklog_synced">): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO runs (jira_issue_key, jira_issue_summary, date, start_at, stop_at, seconds) VALUES ($1, $2, $3, $4, $5, $6)",
    [run.jira_issue_key, run.jira_issue_summary, run.date, run.start_at, run.stop_at, run.seconds],
  );
  return result.lastInsertId as number;
}

export async function getRuns(startDate?: string, endDate?: string): Promise<RunRecord[]> {
  const db = await getDb();
  if (startDate && endDate) {
    return db.select<RunRecord[]>(
      "SELECT * FROM runs WHERE date >= $1 AND date <= $2 ORDER BY id DESC",
      [startDate, endDate],
    );
  }
  return db.select<RunRecord[]>("SELECT * FROM runs ORDER BY id DESC");
}

export async function deleteRun(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM runs WHERE id = $1", [id]);
}

export async function markRunSynced(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE runs SET worklog_synced = 1 WHERE id = $1", [id]);
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<SettingRecord[]>(
    "SELECT value FROM settings WHERE key = $1",
    [key],
  );
  return rows.length > 0 ? rows[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2",
    [key, value],
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM settings WHERE key = $1", [key]);
}

export async function addRunDescriptions(
  runId: number,
  descriptions: { description: string; recorded_at: string }[],
): Promise<void> {
  if (descriptions.length === 0) return;
  const db = await getDb();
  for (const d of descriptions) {
    await db.execute(
      "INSERT INTO run_descriptions (run_id, description, recorded_at) VALUES ($1, $2, $3)",
      [runId, d.description, d.recorded_at],
    );
  }
}

export async function getRunDescriptions(runId: number): Promise<RunDescriptionRecord[]> {
  const db = await getDb();
  return db.select<RunDescriptionRecord[]>(
    "SELECT * FROM run_descriptions WHERE run_id = $1 ORDER BY id ASC",
    [runId],
  );
}

export async function updateRunDescription(id: number, text: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE run_descriptions SET description = $1 WHERE id = $2", [text, id]);
}

export async function deleteRunDescription(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM run_descriptions WHERE id = $1", [id]);
}
