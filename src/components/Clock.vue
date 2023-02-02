<template>
  <span class="text-white text-h4 time">{{ currDate }} {{ currTime }}</span>
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
    },
    currDate() {
      return this.$store.state.clock.currDate
    }
  },
  methods: {
    updateTime() {
      setTimeout(() => {
        const timeStamp = Date.now()
        const currTime = date.formatDate(timeStamp, 'YYYY-MM-DD HH:mm:ss')
        const dateTime = currTime.split(' ')
        if (this.currDate !== dateTime[0]) this.$store.commit('clock/updateDate', dateTime[0])
        this.$store.commit('clock/updateTime', dateTime[1])
        this.updateTime()
      }, 1000);
    }
  }
}
</script>
