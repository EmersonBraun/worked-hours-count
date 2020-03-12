<template>
    <q-select
      filled
      outlined
      v-model="task"
      :options="tasks"
      label="Task Name"
      dark 
      class="text-h4 col-12"
      option-value="task"
      option-label="task"
      emit-value
      map-options
      @input="$emit('input', task)"
    />
</template>

<script>
export default {
  name: 'SelectTask',
  data () {
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
        const res = await this.$db.tasks.toArray()
        const filtered = res.filter(v => v.done == false)
        this.tasks = filtered
      } catch (error) {
        console.error(error.message)
      }
    },
  }

}
</script>
