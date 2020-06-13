<template>
  <v-content>
    <v-container fluid>
      <h1>Logging you in...</h1>
      <v-alert v-for="error in errorMessages" type="error" :key="error">
        {{ error }}
      </v-alert>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import { AuthClient } from '../pb/AuthServiceClientPb'

import { CompleteTokenLoginReq, CompleteSignupReq } from '../pb/auth_pb'

import * as grpcWeb from 'grpc-web'

const authClient = new AuthClient("http://127.0.0.1:8888")

import Store, { AuthenticationState } from '../store'

import Router from '../router'

export default Vue.extend({
  data: () => ({
    loading: true,
    errorMessages: [] as Array<string>,
    successMessages: [] as Array<string>,
  }),

  created () {
    this.fetchData()
  },

  methods: {
    fetchData: function () {
      const req = new CompleteSignupReq()
      req.setToken(this.$route.params.token)
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
        if (err.code == grpcWeb.StatusCode.UNAUTHENTICATED) {
          this.errorMessages = ['Invalid token, please try again.']
        } else {
          this.errorMessages = ['Unknown error.']
        }
      })
    },
  }
})
</script>
