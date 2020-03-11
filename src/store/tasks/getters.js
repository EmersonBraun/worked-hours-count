import db from '../../boot/dexie'
export function listTasks () {
    try {
        const res = db.tasks.toArray();
        return res
    } catch (error) {
        console.error(error.message)
    }
}

