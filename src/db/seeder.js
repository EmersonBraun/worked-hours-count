import { db } from '../boot/dexie'
import { date } from 'quasar'
const seeder = {
    runs: [],
    tasks: [],
    async upDB() {
        // await db.tasks.clear()
        // await db.runs.clear()
        const tasks = await this.counTasks()
        const runs = await this.counRuns()
        if (tasks && runs) return true
        return false
    },
    async counTasks() {
        try {
            const res = await db.tasks.count();
            if (!res) this.populateTasks()
            else return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    },
    async counRuns() {
        try {
            const res = await db.runs.count();
            if (!res) this.populateRuns()
            else return true
        } catch (error) {
            console.error(error.message)
            return false
        }
    },
    populateRuns() {
        this.runs.forEach((run) => {
            if (!run.seconds) run.seconds = date.getDateDiff(`${run.date} ${run.stop_at}`, `${run.date} ${run.start_at}`, 'seconds')
            db.runs.add(run)
                .then((response) => {
                    console.log('Registred', response)
                    return true
                })
                .catch((error) => {
                    console.error(error.message)
                    console.log('Not Registred')
                    return false
                })
        })
    },
    populateTasks() {
        this.tasks.forEach((task) => {
            if (!task.seconds) this.seconds = date.getDateDiff(`${task.date} ${task.stop_at}`, `${task.date} ${task.start_at}`, 'seconds')
            db.tasks.add(task)
                .then((response) => {
                    console.log('Registred', response)
                    return true
                })
                .catch((error) => {
                    console.error(error.message)
                    console.log('Not Registred')
                    return false
                })
        })
    },
}

export default seeder;
