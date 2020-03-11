<template>
  <div class="row q-col-gutter-xs">
    <div class="time run time-center">{{time.hr | twoDigit}}:{{time.min | twoDigit}}:{{time.sec | twoDigit}}</div>
    <!-- <q-input filled outlined v-model="registry.task" label="Task Name" dark class="text-h4 col-12"/> -->
    <SelectTask v-model="registry.task"/>
    <q-input filled outlined v-model="registry.start_at" label="Start At" disable dark class="text-h4 col-6"/>
    <q-input filled outlined v-model="registry.stop_at" label="Stop At" disable dark class="text-h4 col-6"/>
    <q-btn :disable="!registry.task" v-if="!isRunning" color="primary" size="35px" class="full-width" icon="play_arrow" label="Start" @click="start"/>
    <q-btn v-else color="primary" size="35px" class="full-width" icon="stop" label="Stop" @click="stop"/>
  </div>
</template>

<script>
import SelectTask from './SelectTask'
export default {
  name: 'RunTime',
  components: {SelectTask},
  data () {
    return {
      time: {hr: 0,min: 0,sec: 0},
      registry: {
        task: null
      },
    }
  },
  filters: {
    twoDigit (value) {
      if(value < 10) return `0${value}`
      return value
    }
  },
  computed: {
    isRunning() {
      return this.$store.state.clock.running
    },

  },
  methods: {
    start() {
      if(this.registry.task) {
        this.reset()
        this.toogleRun()
        this.registry.start_at = this.$store.state.clock.currTime
        this.runClock()
      } 
      // if (this.timeBegan === null) {
      //   this.reset();
      //   this.timeBegan = new Date();
      // }
      // if (this.timeStopped !== null) {
      //   this.stoppedDuration += (new Date() - this.timeStopped)
      // }
      // this.started = setInterval(this.clockRunning(), 10)	
      // this.running = true;
    },
    stop() {
      this.registry.stop_at = this.$store.state.clock.currTime
      this.toogleRun()
      // this.timeStopped = new Date();
      // clearInterval(this.started);
    },
    reset() {
      // this.running = false;
      // clearInterval(started);
      // this.stoppedDuration = 0;
      // this.timeBegan = null;
      // this.timeStopped = null;
      this.time =  {hr: 0,min: 0,sec: 0}
      this.registry.start_at = null
      this.registry.stop_at = null
    },
    runClock(){
        setTimeout(()=>{ 
            if(this.isRunning) {
                this.addSecconds() 
                this.runClock()
            }
        }, 1000);  
    },
    toogleRun() {
      this.$store.commit('clock/toogleRunning')
    },
    addSecconds () {
      if (this.time.sec<59) this.time.sec++
      else this.addMinutes()
    },
    addMinutes () {
      this.time.sec = 0
      if(this.time.min>24) this.pommodoro()
      if (this.time.min<59) this.time.min++
      else this.addHours()
    },
    addHours () {
      this.time.min = 0
      this.time.hr++
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

