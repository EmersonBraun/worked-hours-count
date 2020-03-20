<template>
  <q-page padding>
    <q-table
      title="Runs"
      :data="runs"
      :columns="columns"
      row-key="name"
      dark
      color="amber"
    >
      <template v-slot:top-right>
        <q-btn
          color="primary"
          icon-right="archive"
          label="Export to csv"
          no-caps
          @click="exportTable"
        />
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <!-- <q-btn dense round flat color="grey" @click="editRow(props.row)" icon="edit"></q-btn> -->
          <q-btn dense round flat color="grey" @click="deleteRow(props.row)" icon="delete"></q-btn>
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { exportFile } from 'quasar'

function wrapCsvValue (val, formatFn) {
  let formatted = formatFn !== void 0 ? formatFn(val) : val

  formatted = formatted === void 0 || formatted === null ? '' : String(formatted)

  formatted = formatted.split('"').join('""')
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  return `"${formatted}"`
}
export default {
  name: 'List',
  data() {
    return {
      filter: '',
      runs: [],
      columns: [
        {name: 'task',label: 'Task',align: 'left',field: row => row.task,sortable: true},
        { name: 'date', align: 'center', label: 'Date', field: 'date', sortable: true },
        { name: 'start_at', label: 'Start at', field: 'start_at', sortable: true },
        { name: 'stop_at', label: 'Stop at', field: 'stop_at' , sortable: true},
        { name: 'seconds', label: 'Run Time', field: 'seconds', format: val => `${this.formatHour(val)}`, },
        { name: 'actions', label: 'Actions', field: 'actions' }
      ],
    }
  },
  created() {
    this.list()
  },
  methods: {
    formatHour(val) {
      if(!val) return 0
      return val
    },
    async list() {
      try {
        const res = await this.$db.runs.toArray();
        this.runs = res
      } catch (error) {
        console.error(error.message)
      }
    },
    editRow(registry) {

    },
    deleteRow(registry) {
      this.$db.runs.delete(registry.id)
      .then((response) => {
        this.msg('Deleted')
        this.list()
      })
      .catch((error) => {
        console.error(error.message)
        this.msg('Not Deleted', false)
      });
    },
    msg(msg, happen=true) {
      const color = happen ? 'primary' : 'error'
      this.$q.notify({
        message: msg,
        color: color
      })
    },
    exportTable () {
      // naive encoding to csv format
      const content = [ this.columns.map(col => wrapCsvValue(col.label)) ].concat(
        this.runs.map(row => this.columns.map(col => wrapCsvValue(
          typeof col.field === 'function'
            ? col.field(row)
            : row[col.field === void 0 ? col.name : col.field],
          col.format
        )).join(','))
      ).join('\r\n')

      const status = exportFile(
        'table-export.csv',
        content,
        'text/csv'
      )

      if (status !== true) {
        this.$q.notify({
          message: 'Browser denied file download...',
          color: 'negative',
          icon: 'warning'
        })
      }
    }
  }
}
</script>
