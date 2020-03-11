<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md">
        <RunTime />
    </div>
    <!-- {{db}} -->
  </q-page>
</template>

<script>
import RunTime from '../components/RunTime'
export default {
  name: 'PageIndex',
  components: {RunTime},
  data() {
    return {
      text: 'asd',
      db: null
    }
  }
}
</script>
<style lang="stylus">
.middle-width {
    width: 50% !important;
    margin-left: 25% !important;
    margin-right: 25% !important;
}
</style>
