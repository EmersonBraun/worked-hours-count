<template>
  <q-layout view="hHh lpR fFr">
    <HeaderPage />
    <q-page-container class="bg-blue-grey-9 text-primary text-white">
      <router-view />
    </q-page-container>
    <FooterMenu />
  </q-layout>
</template>

<script>

import FooterMenu from '../components/FooterMenu.vue'
import HeaderPage from '../components/HeaderPage.vue'
export default {
  name: 'MainLayout',
  components: { FooterMenu, HeaderPage },
  data() {
    return {
      tab: 'principal',
    }
  }
}
</script>