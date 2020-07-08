<template>
  <v-app>
    <v-system-bar color="warning" app>
      <v-icon>mdi-alert-circle</v-icon>
      <span>This is a development version. <b>Please</b> report <b>any</b> bugs and glitches you notice to us at <a href="mailto:bugs@couchers.org">bugs@couchers.org</a>, or message us on the <a href="https://community.couchers.org/u/aapeli">forum</a>.</span>
    </v-system-bar>

    <v-app-bar app color="primary" dark clipped-left>
      <v-app-bar-nav-icon v-if="authenticated" @click.stop="drawer = !drawer" />
      <v-toolbar-title class="ml-0 pl-4">Couchers.org</v-toolbar-title>
      <v-spacer></v-spacer>
      <search-box class="mx-auto"></search-box>
      <v-spacer></v-spacer>
    </v-app-bar>

    <drawer v-if="authenticated" v-model="drawer" />

    <router-view/>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

import Store from './store'

import Drawer from './components/Drawer.vue'
import SearchBox from './components/SearchBox.vue'

export default Vue.extend({
  components: {
    Drawer,
    SearchBox
  },

  data: () => ({
    drawer: null
  }),

  computed: {
    authenticated() {
      return Store.getters.authenticated
    }
  },

  methods: {
    drawerChange(val: boolean) {
      this.drawer = val
    }
  }
});
</script>
