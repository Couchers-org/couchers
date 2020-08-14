<template>
  <v-navigation-drawer v-model="visible" app clipped>
    <v-list-item>
      <v-list-item-avatar>
        <v-avatar :color="user.color" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title class="title">{{ user.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ handle(user.username) }}</v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-divider></v-divider>

    <v-list dense nav>
      <v-list-item link to="/">
        <v-list-item-icon>
          <v-icon>mdi-home</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Home</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link to="/profile">
        <v-list-item-icon>
          <v-icon>mdi-account</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Profile</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link to="/hostrequests">
        <v-list-item-icon>
          <v-icon>mdi-briefcase</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Host Requests</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link to="/messages">
        <v-list-item-icon>
          <v-icon>mdi-forum</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Messages</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link to="/friends">
        <v-list-item-icon>
          <v-icon>mdi-account-multiple</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Friends</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link href="https://sso-test.couchers.org/session/sso">
        <v-list-item-icon>
          <v-icon>mdi-account-group</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Go to Forum</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item link href="https://couchers.org">
        <v-list-item-icon>
          <v-icon>mdi-help-box</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>About</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider inset vertical></v-divider>
      <v-list-item link to="/logout">
        <v-list-item-icon>
          <v-icon>mdi-logout-variant</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"

import Store from "../store"

import { handle } from "../utils"

import { client } from "../api"
import { mapState, mapMutations } from "vuex"

export default Vue.extend({
  methods: {
    handle,

    ...mapMutations(["updateDrawerOpen"]),
  },

  computed: {
    visible: {
      get(): boolean {
        return this.drawerOpen
      },
      set(val: boolean): void {
        this.updateDrawerOpen(val)
      },
    },

    ...mapState(["user", "drawerOpen"]),
  },
})
</script>
