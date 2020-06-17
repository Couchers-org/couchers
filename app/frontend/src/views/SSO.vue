<template>
  <v-content>
    <v-container fill-height>
      Hi
      <v-btn v-on:click="doSSO">Do SSO</v-btn>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import { SSOReq } from '../pb/api_pb'
import client from '../api'

import Store, { AuthenticationState } from '../store'

import Router from '../router'

export default Vue.extend({
  data: () => ({
    //
  }),

  methods: {
    doSSO() {
      const req = new SSOReq()

      req.setSso(this.$route.query.sso)
      req.setSig(this.$route.query.sig)

      client.sSO(req, null).then(res => {
        console.log(res.getRedirectUrl())
        console.log(res)
      }).catch(console.error)
    },
  },
})
</script>
