<template>
  <q-page padding>
    <div>
      <q-input filled outlined v-model="registry.task" label="Task Name" dark class="text-h4 col-12" />
      <q-btn :disable="!registry.task" v-if="registry.id" color="primary" size="20px" class="full-width" icon="edit"
        label="Edit" @click="update" />
      <q-btn :disable="!registry.task" v-else color="primary" size="20px" class="full-width" icon="plus" label="Create"
        @click="create" />
    </div>
    <div>
      <q-list dark bordered separator>
        <q-item clickable v-ripple v-for="task in tasks" :key="task.id" :class="{ 'bg-grey-6': task.done }">
          <q-item-section>
            <q-item-label>{{ task.task }}</q-item-label>
            <!-- <q-item-label caption>{{task.done}}</q-item-label> -->
          </q-item-section>
          <q-item-section top side>
            <div class="text-white q-gutter-xs">
              <q-btn class="gt-xs" size="12px" flat dense round icon="done" @click="done(task)" />
              <q-btn class="gt-xs" size="12px" flat dense round icon="edit" @click="edit(task)" />
              <q-btn class="gt-xs" size="12px" flat dense round icon="delete" @click="remove(task.id)" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
import crud from '../db/crud'

export default {
  name: 'Tasks',
  data() {
    return {
      registry: {
        done: false
      },
      tasks: []
    }
  },
  created() {
    this.list()
  },
  methods: {
    clean() {
      this.registry = { done: false }
    },
    async list() {
      const res = await crud.all('tasks')
      this.tasks = res
    },
    async create() {
      if (this.registry.task) {
        const checkIfExist = this.tasks.find(v => v.task == this.registry.task)
        if (checkIfExist) {
          this.$q.notify({
            message: 'Task already exist',
            color: 'negative',
            timeout: 2000
          })
          return
        }
        const res = crud.create('tasks', this.registry, true)
        if (res) {
          this.list()
          this.clean()
        }
      }
    },
    edit(row) {
      this.registry = row
    },
    done(row) {
      this.registry = row
      this.registry.done = !this.registry.done
      this.update()
    },
    update() {
      const res = crud.update('tasks', this.registry)
      if (res) {
        this.list()
        this.clean()
      }
    },
    remove(id) {
      const res = crud.remove('tasks', id)
      if (res) this.list()
    },
  }
}
</script>
<style  scoped>
.task-done {
   text-decoration:line-through;
}
</style>
