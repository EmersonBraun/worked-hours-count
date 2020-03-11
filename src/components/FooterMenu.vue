<template>
  <q-footer bordered class="bg-blue-grey-10 text-primary text-white">
    <q-tabs narrow-indicator active-color="primary" align="justify" class="text-grey" v-model="tab">
      <q-route-tab name="principal" label="Principal" to="/" exact/>
      <q-route-tab name="tasks" label="Tasks" to="/tasks" exact/>
      <q-route-tab name="list" label="List" to="/list" exact/>
    </q-tabs>
  </q-footer>
</template>

<script>
export default {
  name: 'FooterMenu',
  data() {
    return {
      tab: 'principal'
    }
  },
}
</script>
