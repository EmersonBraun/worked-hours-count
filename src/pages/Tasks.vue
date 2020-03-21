<template>
  <q-page padding>
      <div>
        <q-input filled outlined v-model="registry.task" label="Task Name" dark class="text-h4 col-12"/>
        <q-btn :disable="!registry.task" v-if="registry.id" color="primary" size="20px" class="full-width" icon="edit" label="Edit" @click="update"/>
        <q-btn :disable="!registry.task" v-else color="primary" size="20px" class="full-width" icon="plus" label="Create" @click="create"/>
      </div>
      <div>
        <q-list dark bordered separator>
          <q-item clickable v-ripple v-for="task in tasks" :key="task.id" :class="{'bg-grey-6': task.done }">
            <q-item-section>
              <q-item-label>{{task.task}}</q-item-label>
              <!-- <q-item-label caption>{{task.done}}</q-item-label> -->
            </q-item-section>
            <q-item-section top side>
              <div class="text-white q-gutter-xs">
                <q-btn class="gt-xs" size="12px" flat dense round icon="done" @click="done(task)"/>
                <q-btn class="gt-xs" size="12px" flat dense round icon="edit" @click="edit(task)"/>
                <q-btn class="gt-xs" size="12px" flat dense round icon="delete" @click="remove(task.id)"/>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div> 
  </q-page>
</template>

<script>
import { exportFile } from 'quasar'
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
      this.registry = {done: false}
    },
    async list() {
      try {
        const res = await this.$db.tasks.toArray();
        this.tasks = res
      } catch (error) {
        console.error(error.message)
      }
    },
    create() {
      if(this.registry.task){
        this.$db.tasks.add(this.registry)
        .then((response) => {
          this.clean()
          this.msg('Created')
        })
        .catch((error) => {
          console.error(error.message)
          this.msg('Not Created', false)
        });
      }
    },
    edit(row) {
      this.registry = row
    },
    done(row){
      this.registry = row
      this.registry.done = !this.registry.done
      this.update()
    },
    update(){
      this.$db.tasks.update(this.registry.id,this.registry)
        .then((response) => {
          this.clean()
          this.msg('Updated')
        })
        .catch((error) => {
          console.error(error.message)
          this.msg('Not Updated', false)
        });
    },
    remove(id){
      if(confirm('are you sure?')) {
        this.$db.tasks.delete(id)
          .then((response) => {
            this.clean()
            this.msg('Deleted')
          })
          .catch((error) => {
            console.error(error.message)
            this.msg('Not Deleted', false)
          });
      }
    },
    msg(msg, happen=true) {
      const color = happen ? 'primary' : 'error'
      this.$q.notify({
        message: msg,
        color: color
      })
      if(happen) this.list()
    }
  }
}
</script>
<style lang="stylus" scoped>
.task-done {
   text-decoration:line-through;
}
</style>
