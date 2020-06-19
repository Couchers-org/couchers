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
import Vue from 'vue';

import Store from '../store'

import { PingReq } from '../pb/api_pb'

import { client } from '../api'

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
