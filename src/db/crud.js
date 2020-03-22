import db from '../boot/dexie'
import { Notify } from 'quasar'
const crud = {
    async count(table, debug=false) {
        if (debug) console.log('Count table', table)
        try {
            const res = await db[table].count();
            if(debug) console.log('Count',res)
            return res
        } catch (error) {
            console.error(error.message)
        }
    },
    async all(table, debug=false) {
        if (debug) console.log('All table', table)
        try {
            const res = await db[table].toArray()
            if (debug) console.log('All', res)
            return res
        } catch (error) {
            console.error(error.message)
        }
    },
    async whereBetween(table, column, ini, end, debug = false) {
        if (debug) console.log('WhereBetween table', table)
        if (debug) console.log('WhereBetween colum', column)
        if (debug) console.log('WhereBetween ini', ini)
        if (debug) console.log('WhereBetween end', end)
        try {
            const res = await db[table].where(column).between(ini, end).toArray();
            if (debug) console.log('WhereBetween', res)
            return res
        } catch (error) {
            console.error(error.message)
        }
    },
    async create(table, registry, debug = false) {
        if (debug) console.log('Create table', table)
        if (debug) console.log('Create registry', registry)
        try {
            const res = await db[table].add(registry);
            this.msg('Created')
            if (debug) console.log('Create', res)
            return res
        } catch (error) {
            console.error(error.message)
            this.msg('Not Created', false)
        }
    },
    async update(table, registry, debug = false) {
        if (debug) console.log('Update table', table)
        if (debug) console.log('Update registry', registry)
        try {
            const res = await db[table].update(registry.id, registry)
            this.msg('Updated')
            if (debug) console.log('Update', res)
            return res
        } catch (error) {
            console.error(error.message)
            this.msg('Not Updated', false)
        }
    },
    async remove(table, id, debug = false) {
        if (debug) console.log('Remove table', table)
        if (debug) console.log('Remove id', id)
        if (confirm('are you sure?')) {
            try {
                const res = await db[table].delete(id)
                this.msg('Deleted')
                if (debug) console.log('Delete', res)
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