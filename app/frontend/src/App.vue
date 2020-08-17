<template>
  <v-app>
    <v-system-bar color="warning" app>
      <v-icon>mdi-alert-circle</v-icon>
      <span
        >This is a development version. :)</span>
    </v-system-bar>

    <v-app-bar app color="primary" dark clipped-left>
      <v-app-bar-nav-icon
        v-if="authenticated && !anonRoute"
        @click.stop="updateDrawerOpen(!drawerOpen)"
      />
      <v-toolbar-title class="ml-0 pl-4">Couchers.org</v-toolbar-title>
      <v-spacer></v-spacer>
      <search-box v-if="authenticated && !anonRoute" class="mx-auto">
      </search-box>
      <v-spacer></v-spacer>
    </v-app-bar>

    <drawer v-if="authenticated && !anonRoute" />

    <router-view />
  </v-app>
</template>

<script lang="ts">
import Vue from "vue"

import { mapGetters, mapState, mapMutations } from "vuex"

import Store from "./store"

import Drawer from "./components/Drawer.vue"
import SearchBox from "./components/SearchBox.vue"

Store.dispatch("scheduler")

export default Vue.extend({
  components: {
    Drawer,
    SearchBox,
  },

  computed: {
    anonRoute() {
      return this.$route.meta.noAuth
    },
    ...mapGetters(["authenticated"]),
    ...mapState(["drawerOpen"]),
  },

  methods: {
    ...mapMutations(["updateDrawerOpen"]),
  },
})
</script>
