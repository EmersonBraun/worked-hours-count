use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create runs and settings tables",
            sql: "CREATE TABLE runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                jira_issue_key TEXT NOT NULL,
                jira_issue_summary TEXT NOT NULL,
                date TEXT NOT NULL,
                start_at TEXT NOT NULL,
                stop_at TEXT NOT NULL,
                seconds INTEGER NOT NULL,
                worklog_synced INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create run_descriptions table",
            sql: "CREATE TABLE run_descriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                recorded_at TEXT NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create issue_notes table",
            sql: "CREATE TABLE issue_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                jira_issue_key TEXT NOT NULL,
                description TEXT NOT NULL,
                recorded_at TEXT NOT NULL
            );",
            kind: MigrationKind::Up,
        },
    ];

    let mut builder = tauri::Builder::default();

    #[cfg(any(target_os = "macos", windows, target_os = "linux"))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {}));
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:worked_hours.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
