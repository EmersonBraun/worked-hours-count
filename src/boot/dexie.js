import Vue from 'vue'
import Dexie from 'dexie';

const db = new Dexie('myDb');
db.version(1).stores({
    runs: '++id, task_id, date, start_at, stop_at',
    tasks: '++id, task, done',
});

Vue.prototype.$db = db

export default db