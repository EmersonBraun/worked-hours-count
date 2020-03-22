import db from '../boot/dexie'
const seeder = {
    runs: [
        { task: "Introdução", date: "2020-03-09", start_at: "14:09:12", stop_at: "17:05:02", seconds: 10550 },
        { task: "Métodos de Login", date: "2020-03-10", start_at: "14:00:15", stop_at: "15:02:21", seconds: 3726 },
        { task: "Métodos de Login", date: "2020-03-10", start_at: "15:10:01", stop_at: "17:02:02", seconds: 6721 },
        { task: "Geração de Sites", date: "2020-03-11", start_at: "14:05:09", stop_at: "14:12:21", seconds: 432 },
        { task: "Google Maps", date: "2020-03-11", start_at: "14:12:50", stop_at: "15:08:13", seconds: 3323 },
        { task: "Geração de PDF", date: "2020-03-11", start_at: "15:12:03", stop_at: "17:22:31", seconds: 7828 },
        { task: "Google Maps", date: "2020-03-12", start_at: "14:12:07", stop_at: "18:12:05", seconds: 14398 },
        { task: "CLUSTER", date: "2020-03-13", start_at: "14:03:05", stop_at: "17:45:13", seconds: 13328 },
        { task: "Exemplo Gmaps", date: "2020-03-16", start_at: "14:03:08", stop_at: "19:20:08", seconds: 19020 },
        { task: "Introd. Sistema", date: "2020-03-17", start_at: "13:59:45", stop_at: "16:12:06", seconds: 7941 },
        { task: "Login", date: "2020-03-18", start_at: "20:56:58", stop_at: "23:01:02", seconds: 7444 },
        { task: "Seeder Login", date: "2020-03-19", start_at: "14:17:00", stop_at: "14:59:41", seconds: 2561 },
        { task: "Seeder Login", date: "2020-03-19", start_at: "15:07:27", stop_at: "18:42:59", seconds: 12932 },
        { task: "CRUD user", date: "2020-03-20", start_at: "19:33:12", stop_at: "22:13:58", seconds: 9646 },
    ],
    tasks: [
        { task: 'Introdução', done: false },
        { task: 'Métodos de Login', done: false },
        { task: 'Geração de Sites', done: false },
        { task: 'Geração de PDF', done: false },
        { task: 'Google Maps', done: false },
        { task: 'CLUSTER', done: false },
        { task: 'Exemplo Gmaps', done: false },
        { task: 'Introd.Sistema', done: false },
        { task: 'Login', done: false },
        { task: 'Seeder Login', done: false },
        { task: 'CRUD user', done: false },
    ],
    async upDB() {
        const tasks = await this.counTasks()
        const runs = await this.counRuns()
        if(tasks && runs) return true
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
