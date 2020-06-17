<template>
  <v-app>
    <v-system-bar color="warning" app>
      <v-icon>mdi-alert-circle</v-icon>
      <span>This is a development version. <b>Please</b> report <b>any</b> bugs and glitches you notice to us at <a href="mailto:bugs@couchers.org">bugs@couchers.org</a>, or message us on the <a href="https://community.couchers.org/u/aapeli">forum</a>.</span>
    </v-system-bar>

    <v-app-bar app color="primary" dark>
      <div class="d-flex align-center">
        Couchers.org
      </div>
    </v-app-bar>

    <v-navigation-drawer app permanent>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">
            {{ name }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ username }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item link to="/login">
          <v-list-item-icon>
            <v-icon>mdi-login-variant</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Login</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/signup">
          <v-list-item-icon>
            <v-icon>mdi-plus-circle</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Sign up</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/">
          <v-list-item-icon>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/user/1">
          <v-list-item-icon>
            <v-badge color="success" content="3" overlap>
              <v-icon>mdi-account</v-icon>
            </v-badge>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/messages">
          <v-list-item-icon>
            <v-badge color="success" content="3" overlap>
              <v-icon>mdi-inbox</v-icon>
            </v-badge>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Messages</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-icon>
            <v-badge color="warning" content="999+" overlap>
              <v-icon>mdi-alert-circle</v-icon>
            </v-badge>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Spam</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/friends">
          <v-list-item-icon>
            <v-icon>mdi-handshake</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Friends</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-image</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Photos</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/about">
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
    <router-view/>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

import Store from './store'

import { PingReq } from './pb/api_pb'

import client from './api'

export default Vue.extend({
  name: 'App',

  data: () => ({
    //
  }),

  created () {
    this.updateData()
  },

  watch: {
    '$store.state.auth': function () {
      this.updateData()
    }
  },

  methods: {
    updateData: function () {
      client.ping(new PingReq(), null).then(res => {
        Store.commit('updateUser', {
          username: res.getUsername(),
          name: res.getName()
        })
      }).catch(err => {
        console.error('Failed to ping server: ', err)
      })
    }
  },

  computed: {
    username: function () {
      return Store.state.username
    },
    name: function () {
      return Store.state.name
    },
  }
});
</script>
