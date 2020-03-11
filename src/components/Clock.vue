<template>
  <span class="text-white text-h4 time">{{currTime}}</span>
</template>

<script>
import { date } from 'quasar'
export default {
  name: 'Clock',
  mounted() {
    this.updateTime()
  },
  computed: {
    currTime() {
      return this.$store.state.clock.currTime
    }
  },
  methods: {
    updateTime() {
      setTimeout(()=>{ 
        const timeStamp = Date.now()
        const currTime = date.formatDate(timeStamp, 'YYYY-MM-DD HH:mm:ss')
        this.$store.commit('clock/updateTime', currTime)
        this.updateTime() 
      }, 1000);
    }
  }
}
</script>
