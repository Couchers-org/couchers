<template>
  <v-content>
    <v-container fluid>
      <error-alert :error="error"/>
      <loading-circular :loading="loading">Logging you in...</loading-circular>
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
import LoadingCircular from '../components/LoadingCircular.vue'

export default Vue.extend({
  data: () => ({
    loading: true,
    error: null as (Error | null),
    successMessages: [] as Array<string>,
  }),

  components: {
    ErrorAlert,
    LoadingCircular
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
