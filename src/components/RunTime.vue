<template>
  <div class="row q-col-gutter-xs">
    <div class="time run time-center">{{ time }}</div>
    <SelectTask v-model="registry.task" />
    <q-input filled outlined v-model="registry.start_at" label="Start At" disable dark class="text-h4 col-6" />
    <q-input filled outlined v-model="registry.stop_at" label="Stop At" disable dark class="text-h4 col-6" />
    <q-btn :disable="!registry.task" v-if="!isRunning" color="primary" size="35px" class="full-width" icon="play_arrow"
      label="Start" @click="start" />
    <q-btn v-else color="primary" size="35px" class="full-width" icon="stop" label="Stop" @click="stop" />
  </div>
</template>

<script>
import dateUtils from '../utils/dateUtils'
import { date } from 'quasar'
import crud from '../db/crud'
import SelectTask from './SelectTask.vue'
export default {
  name: 'RunTime',
  components: { SelectTask },
  data() {
    return {
      time: '00:00:00',
      registry: {
        task: null
      },
    }
  },
  computed: {
    isRunning() {
      return this.$store.state.clock.running
    },
    completeDate() {
      return `${this.$store.state.clock.currDate} ${this.$store.state.clock.currTime}`
    },
    currDate() {
      return this.$store.state.clock.currDate
    },
    currTime() {
      return this.$store.state.clock.currTime
    }
  },
  methods: {
    async create() {
      const res = await crud.create('runs', this.registry)
      if (res) {
        this.registry = { task: null }
      }
    },
    start() {
      if (this.registry.task) {
        this.reset()
        this.toogleRun()
        this.registry.date = this.$store.state.clock.currDate
        this.registry.start_at = this.$store.state.clock.currTime
        this.runClock()
      }
    },
    stop() {
      this.registry.stop_at = this.$store.state.clock.currTime
      const init = `${this.registry.date} ${this.registry.start_at}`
      const end = `${this.registry.date} ${this.registry.stop_at}`
      this.registry.seconds = date.getDateDiff(end, init, 'seconds')
      this.toogleRun()
      this.create()
      this.reset()
    },
    reset() {
      this.time = '00:00:00'
      this.registry.start_at = null
      this.registry.stop_at = null
    },
    runClock() {
      setTimeout(() => {
        if (this.isRunning) {
          this.updateClock()
          this.runClock()
        }
      }, 1000);
    },
    toogleRun() {
      this.$store.commit('clock/toogleRunning')
    },
    updateClock() {
      const endTime = this.completeDate
      const iniTime = `${this.currDate} ${this.registry.start_at}`
      const newTime = date.getDateDiff(endTime, iniTime, 'seconds')
      this.time = dateUtils.convertSeconds(newTime) || '00:00:00'
    },
    pommodoro() {
      // this.$q.notify({
      //   message: 'Go take a break',
      //   multiLine: true,
      //   color: 'primary'
      // })
    }
  }
}
</script>
<style >
.time {
  letter-spacing: 0.12em;
  font-family: 'Share Tech Mono', monospace;
  color: #ffffff;
  color: #daf6ff;
  text-shadow: 0 0 15px rgba(10, 175, 230, 1),  0 0 20px rgba(10, 175, 230, 0);
}
.run {
  padding: 15px;
  font-size: 120px;
  text-align: center;
  position: absolute;
  left: 50%;
  top: 15%;
}
.time-center {
  transform: translate(-50%, -50%);
}
</style>

