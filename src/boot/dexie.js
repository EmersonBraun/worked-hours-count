import Dexie from 'dexie';

const db = new Dexie('myDb');

db.version(1).stores({
    runs: '++id, task, date, start_at, stop_at, seconds',
    tasks: '++id, task, done',
});

export default ({ app }) => {
    app.use(db)
}

export {
    db
}