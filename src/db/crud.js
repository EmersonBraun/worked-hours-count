import { db } from '../boot/dexie'
import { Notify } from 'quasar'

const crud = {
    async count(table, debug = false) {
        if (debug) console.log('Count table input', { table })
        try {
            const res = await db[table].count();
            if (debug) console.log('Count table output', res)
            return res
        } catch (error) {
            console.error(error.message)
        }
    },
    async all(table, debug = false) {
        if (debug) console.log('All table input', { table })
        try {
            const res = await db[table].toArray()
            if (debug) console.log('All table output', res)
            return res
        } catch (error) {
            console.error(error.message)
        }
    },
    async whereBetween(table, column, ini, end, debug = false) {
        if (debug) console.log('WhereBetween input', { table, column, ini, end })
        try {
            const res = await db[table].where(column).between(ini, end).toArray();
            if (debug) console.log('WhereBetween output', res)
            return res
        } catch (error) {
            console.error(error.message)
        }
    },
    async create(table, registry, debug = false) {
        if (debug) console.log('Create input', { table, registry })

        try {
            const res = await db[table].add({
                ...registry,
            });
            this.msg('Created')
            if (debug) console.log('Create output', res)
            return res
        } catch (error) {
            console.error(error.message)
            this.msg('Not Created', false)
        }
    },
    async update(table, registry, debug = false) {
        if (debug) console.log('Update input', { table, registry })
        try {
            const res = await db[table].update(registry.id, { ...registry })
            this.msg('Updated')
            if (debug) console.log('Update output', res)
            return res
        } catch (error) {
            console.error(error.message)
            this.msg('Not Updated', false)
        }
    },
    async remove(table, id, debug = false) {
        if (debug) console.log('Remove input', { table, id })
        if (confirm('are you sure?')) {
            try {
                const res = await db[table].delete(id)
                this.msg('Deleted')
                if (debug) console.log('Delete output', res)
                return res
            } catch (error) {
                console.error(error.message)
                this.msg('Not Deleted', false)
            }
        }
    },
    msg(msg, happen = true) {
        const color = happen ? 'primary' : 'error'
        Notify.create({
            message: msg,
            color: color
        })
    },
}
export default crud