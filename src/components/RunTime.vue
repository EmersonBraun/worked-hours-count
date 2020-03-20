<template>
  <div class="row q-col-gutter-xs">
    <div class="time run time-center">{{time}}</div>
    <SelectTask v-model="registry.task"/>
    <q-input filled outlined v-model="registry.start_at" label="Start At" disable dark class="text-h4 col-6"/>
    <q-input filled outlined v-model="registry.stop_at" label="Stop At" disable dark class="text-h4 col-6"/>
    <q-btn :disable="!registry.task" v-if="!isRunning" color="primary" size="35px" class="full-width" icon="play_arrow" label="Start" @click="start"/>
    <q-btn v-else color="primary" size="35px" class="full-width" icon="stop" label="Stop" @click="stop"/>
  </div>
</template>

<script>
import { date } from 'quasar'
import SelectTask from './SelectTask'
export default {
  name: 'RunTime',
  components: {SelectTask},
  data () {
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
      return `${this.registry.date} ${this.$store.state.clock.currTime}`
    }
  },
  methods: {
    create() {
      this.$db.runs.add(this.registry)
      .then((response) => {
        this.msg('Registred')
      })
      .catch((error) => {
        console.error(error.message)
        this.msg('Not Registred', false)
      });
    },
    start() {
      if(this.registry.task) {
        this.reset()
        this.toogleRun()
        this.registry.date = this.$store.state.clock.currDate
        this.registry.start_at = this.completeDate
        this.runClock()
      } 
    },
    stop() {
      this.registry.stop_at = this.completeDate
      this.registry.seconds = date.getDateDiff(this.registry.stop_at, this.registry.start_at, 'seconds')
      this.toogleRun()
      this.create()
    },
    reset() {
      this.time =  {hr: 0,min: 0,sec: 0}
      this.registry.start_at = null
      this.registry.stop_at = null
    },
    runClock(){
        setTimeout(()=>{ 
            if(this.isRunning) {
                this.updateClock() 
                this.runClock()
            }
        }, 1000);  
    },
    toogleRun() {
      this.$store.commit('clock/toogleRunning')
    },
    updateClock () {
      const date1 = this.completeDate
      const newTime = date.getDateDiff(date1, this.registry.start_at, 'seconds')
      this.time = new Date(newTime * 1000).toISOString().substr(11, 8)
    },
    msg(msg, happen=true) {
      const color = happen ? 'primary' : 'error'
      this.$q.notify({
        message: msg,
        color: color
      })
    },
    pommodoro () {
      // this.$q.notify({
      //   message: 'Go take a break',
      //   multiLine: true,
      //   color: 'primary'
      // })
    }
  }
}
</script>
<style lang="stylus">
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

