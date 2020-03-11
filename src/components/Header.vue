<template>
  <q-header elevated class="bg-blue-grey-10 text-white">
    <q-toolbar>
      <q-toolbar-title>
        <q-avatar>
          <img src="https://cdn.quasar.dev/logo/svg/quasar-logo.svg">
        </q-avatar>
        Worked Hours Count
      </q-toolbar-title>
      <Clock/>
    </q-toolbar>
  </q-header>
</template>

<script>
import Clock from '../components/Clock'
export default {
  name: 'Header',
  components: {Clock}
}
</script>
