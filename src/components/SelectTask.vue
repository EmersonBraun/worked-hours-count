<template>
  <q-select
    filled
    outlined
    v-model="task"
    :options="tasks"
    :label="!!tasks.length ? 'Task Name' : 'ADD TASKS FIRST'"
    dark class="text-h4 col-12"
    option-value="task"
    option-label="task"
    emit-value
    map-options
    :disable="!tasks.length"
    @input="$emit('input', task)"
  />
</template>

<script>
import { db } from '../boot/dexie'
export default {
  name: 'SelectTask',
  data() {
    return {
      task: '',
      tasks: []
    }
  },
  created() {
    this.list()
  },
  methods: {
    async list() {
      try {
        const res = await db.tasks.toArray()
        console.log(res)
        const filtered = res.filter(v => v.done == false)
        this.tasks = filtered
      } catch (error) {
        console.error(error.message)
      }
    },
  }

}
</script>
