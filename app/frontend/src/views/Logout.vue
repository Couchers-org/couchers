<template>
  <v-content>
    Logging out
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
    name: 'Logout',

    mounted () {
      const req = new DeAuthReq()
      req.setToken(Store.state.authToken!)
      authClient.deauthenticate(req, null).then(res => {
        Store.commit('deauth')
        Router.push({ name: 'Login' })
      }).catch(err => {
        console.error(err)
        Store.commit('error', 'Could not log out!')
      })
    }
  })
</script>
