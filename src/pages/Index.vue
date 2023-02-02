<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md">
      <RunTime />
    </div>
  </q-page>
</template>

<script>
import seeder from '../db/seeder'
import RunTime from '../components/RunTime.vue'
export default {
  name: 'PageIndex',
  components: { RunTime },
  created() {
    this.upDB()
  },
  methods: {
    async upDB() {
      try {
        const res = await seeder.upDB()
        if (res) console.log('DB is up!')
      } catch (error) {
        console.error(error.message)
      }
    },
  }
}
</script>
<style >
.middle-width {
    width: 50% !important;
    margin-left: 25% !important;
    margin-right: 25% !important;
}
</style>
