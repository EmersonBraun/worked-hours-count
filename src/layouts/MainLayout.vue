<template>
  <q-layout view="hHh lpR fFr">

    <Header/>

    <q-page-container class="bg-blue-grey-9 text-primary text-white">
      <router-view />
    </q-page-container>

    <FooterMenu/>

  </q-layout>
</template>

<script>

import FooterMenu from '../components/FooterMenu'
import Header from '../components/Header'
export default {
  name: 'MainLayout',
  components: {FooterMenu, Header},
  data () {
    return {
      tab: 'principal',
    }
  }
}
</script>