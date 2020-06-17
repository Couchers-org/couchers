<template>
  <v-content>
    <v-container fill-height>
      <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
        <v-alert v-for="error in errorMessages" type="error" :key="error">
          {{ error }}
        </v-alert>
        <div v-if="loading">
          <p class="subtitle-1 text-center">Loading...</p>
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
        </div>
      </v-col>
    </v-container>
  </v-content>
</template>

<script lang="ts">
  import Vue from 'vue'

  import { AuthClient } from '../pb/AuthServiceClientPb'
  import { DeAuthReq } from '../pb/auth_pb'

  import * as grpcWeb from 'grpc-web'

  const authClient = new AuthClient("http://127.0.0.1:8888")

  import Store, { AuthenticationState } from '../store'
  import Router from '../router'

  export default Vue.extend({
    data: () => ({
      loading: true,
      errorMessages: []
    }),

    mounted () {
      const req = new DeAuthReq()
      req.setToken(Store.state.authToken!)
      authClient.deauthenticate(req, null).then(res => {
        Store.commit('deauth')
        Router.push({ name: 'Login' })
      }).catch(err => {
        this.loading = false
        this.errorMessages = [err.message]
      })
    }
  })
</script>
