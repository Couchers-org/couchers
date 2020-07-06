<template>
  <v-content>
    <v-container fluid>
      <h1>Logging you in...</h1>
      <error-alert :error="error"/>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import { authClient } from '../api'
import { CompleteTokenLoginReq } from '../pb/auth_pb'

import * as grpcWeb from 'grpc-web'

import Store, { AuthenticationState } from '../store'
import Router from '../router'
import ErrorAlert from '../components/ErrorAlert.vue'

export default Vue.extend({
  data: () => ({
    loading: true,
    error: null as (Error | null),
    successMessages: [] as Array<string>,
  }),

  components: {
    'error-alert': ErrorAlert,
  },

  created () {
    this.fetchData()
  },

  methods: {
    fetchData: function () {
      const req = new CompleteTokenLoginReq()
      req.setLoginToken(this.$route.params.token)
      authClient.completeTokenLogin(req, null).then(res => {
        this.loading = false
        this.successMessages = ['Success.']
        Store.commit('auth', {
          authState: AuthenticationState.Authenticated,
          authToken: res.getToken()
        })
        Router.push('/')
      }).catch(err => {
        this.loading = false
        this.error = err
      })
    },
  }
})
</script>
