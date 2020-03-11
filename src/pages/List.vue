<template>
  <q-page padding>
    <q-table
      title="Runs"
      :data="runs"
      :columns="columns"
      row-key="name"
      dark
      color="amber"
    />
  </q-page>
</template>

<script>
export default {
  name: 'List',
  data() {
    return {
      runs: '++id, task_id, date, start_at, stop_at',
      runs: [],
      columns: [
        {name: 'task_id',label: 'Task',align: 'left',field: row => row.task_id,sortable: true},
        { name: 'date', align: 'center', label: 'Date', field: 'date', sortable: true },
        { name: 'start_at', label: 'Start at', field: 'start_at', sortable: true },
        { name: 'stop_at', label: 'Stop at', field: 'stop_at' },
        { name: 'actions', label: 'Actions', field: 'actions' }
      ],
    }
  },
  created() {
    this.list()
  },
  methods: {
    async list() {
      try {
        const res = await this.$db.runs.toArray();
        // console.error(res)
        this.runs = res
      } catch (error) {
        console.error(error.message)
      }
    },
  }
}
</script>
