<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="q-gutter-md row items-start">
        <q-input filled v-model="init_date" mask="####-##-##" :rules="['date']" class="col-5" dark>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="init_date" @input="() => $refs.qDateProxy.hide()" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-input filled v-model="end_date" mask="####-##-##" :rules="['date']" class="col-5" dark>
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                <q-date v-model="end_date" @input="() => $refs.qDateProxy.hide()" />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
        <q-btn color="primary" label="clear" @click="clear" />
      </div>
    </div>
    <q-table title="Runs" :rows="runs" :columns="columns" row-key="name" dark color="amber">
      <template v-slot:top-right>
        <q-btn color="primary" icon-right="archive" label="Export to csv" no-caps @click="exportTable" />
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <!-- <q-btn dense round flat color="grey" @click="editRow(props.row)" icon="edit"></q-btn> -->
          <q-btn dense round flat color="grey" @click="deleteRow(props.row)" icon="delete"></q-btn>
        </q-td>
      </template>
    </q-table>
    Total: {{ totalSec }}
  </q-page>
</template>

<script>
import dateUtils from '../utils/dateUtils'
import crud from '../db/crud'
import { exportFile } from 'quasar'

function wrapCsvValue(val, formatFn) {
  let formatted = formatFn !== void 0 ? formatFn(val) : val

  formatted = formatted === void 0 || formatted === null ? '' : String(formatted)

  formatted = formatted.split('"').join('""')
    /**
     * Excel accepts \n and \r in strings, but some other CSV parsers do not
     * Uncomment the next two lines to escape new lines
     */

    .split('\n').join('\\n')

    .split('\r').join('\\r')

  return `"${formatted}"`
}
export default {
  name: 'List',
  data() {
    return {
      filter: '',
      init_date: null,
      end_date: null,
      runs: [],
      columns: [
        { name: 'task', label: 'Task', align: 'left', field: row => row.task, sortable: true },
        { name: 'date', align: 'center', label: 'Date', field: 'date', sortable: true },
        { name: 'start_at', label: 'Start at', field: 'start_at', sortable: true },
        { name: 'stop_at', label: 'Stop at', field: 'stop_at', sortable: true },
        { name: 'seconds', label: 'Run Time', field: 'seconds', format: val => `${this.formatHour(val)}`, },
        { name: 'actions', label: 'Actions', field: 'actions' }
      ],
      totalSec: 0
    }
  },
  created() {
    this.list()
  },
  watch: {
    end_date() {
      if (this.end_date && this.init_date) this.filtered()
    },
    init_date() {
      if (this.end_date && this.init_date) this.filtered()
    }
  },
  methods: {
    formatHour(val) {
      return dateUtils.convertSeconds(val);
    },
    async list() {
      const res = await crud.all('runs')
      this.runs = res
      this.total()
    },
    async filtered() {
      const res = await crud.whereBetween('runs', 'date', this.init_date, this.end_date)
      this.runs = res
      this.total()
    },
    async total() {
      const totalSec = this.runs.reduce((t, el) => t += parseInt(el.seconds), 0)
      const formatHR = dateUtils.convertSeconds(totalSec);
      this.totalSec = formatHR
    },
    clear() {
      this.init_date = null
      this.end_date = null
      this.list()
    },
    editRow(registry) {
      console.log(registry)
    },
    deleteRow(registry) {
      const res = crud.remove('runs', registry.id)
      if (res) this.list()
    },
    exportTable() {

      // naive encoding to csv format
      const content = [this.columns.map(col => wrapCsvValue(col.label))].concat(
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
