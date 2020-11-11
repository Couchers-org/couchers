<template>
  <v-app>
    <v-system-bar color="warning" app>
      <v-icon>mdi-alert-circle</v-icon>
      <span>This is a development version. :)</span>
    </v-system-bar>

    <v-app-bar app color="#3f363b" dark clipped-left>
      <v-app-bar-nav-icon
        v-if="showWidgets"
        @click.stop="updateDrawerOpen(!drawerOpen)"
      />
      <v-toolbar-title class="ml-0 pl-4">Couchers.org</v-toolbar-title>
      <v-spacer></v-spacer>
      <search-box v-if="showWidgets" class="mx-auto"> </search-box>
      <v-spacer></v-spacer>
      <bug-tool></bug-tool>
    </v-app-bar>

    <drawer v-if="showWidgets" />

    <router-view />
  </v-app>
</template>

<script lang="ts">
import Vue from "vue"

import { mapGetters, mapState, mapMutations } from "vuex"

import Store from "./store"

import Drawer from "./components/Drawer.vue"
import SearchBox from "./components/SearchBox.vue"

import BugTool from "./components/BugTool.vue"

Store.dispatch("scheduler")

export default Vue.extend({
  components: {
    Drawer,
    SearchBox,
    BugTool,
  },

  computed: {
    showWidgets() {
      // we show the logged in widgets if:
      // * user is logged in
      // * user is not jailed
      return this.authenticated && !this.jailed // && !this.$route.meta.noAuth
    },
    ...mapGetters(["authenticated", "jailed"]),
    ...mapState(["drawerOpen"]),
  },

  methods: {
    ...mapMutations(["updateDrawerOpen"]),
  },
})
</script>
