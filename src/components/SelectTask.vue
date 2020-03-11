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
        const res = await this.$db.tasks.toArray();
        console.error(res)
        this.tasks = res
      } catch (error) {
        console.error(error.message)
      }
    },
  }

}
</script>
