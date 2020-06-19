<template>
  <v-app>
    <v-system-bar color="warning" app>
      <v-icon>mdi-alert-circle</v-icon>
      <span>This is a development version. <b>Please</b> report <b>any</b> bugs and glitches you notice to us at <a href="mailto:bugs@couchers.org">bugs@couchers.org</a>, or message us on the <a href="https://community.couchers.org/u/aapeli">forum</a>.</span>
    </v-system-bar>

    <v-app-bar app color="primary" dark clipped-left>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <div class="d-flex align-center">
        Couchers.org
      </div>
    </v-app-bar>

    <drawer v-model="drawer" />

    <router-view/>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

import Drawer from './components/Drawer.vue'

export default Vue.extend({
  data: () => ({
    drawer: null
  }),

  components: {
    "drawer": Drawer
  },

  methods: {
    drawerChange (val: boolean) {
      this.drawer = val
    }
  }
});
</script>
