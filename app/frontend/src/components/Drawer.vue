<template>
  <v-navigation-drawer v-model="visible" app clipped>
    <v-list-item>
      <v-list-item-avatar>
        <v-avatar :color="color" />
      </v-list-item-avatar>
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
</template>

<script lang="ts">
import Vue from 'vue';

import Store from '../store'

import { PingReq } from '../pb/api_pb'

import client from '../api'

export default Vue.extend({
  props: ['value'],

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
          name: res.getName(),
          color: res.getColor()
        })
      }).catch(err => {
        console.error('Failed to ping server: ', err)
      })
    }
  },

  computed: {
    visible: {
      get() {
        return this.value;
      },
      set(val: boolean) {
        this.$emit('input', val);
      }
    },

    username: function () {
      return Store.state.username
    },
    name: function () {
      return Store.state.name
    },
    color: function () {
      return Store.state.color
    }
  }
});
</script>
