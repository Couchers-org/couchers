<template>
  <v-main>
    <v-container fill-height>
      <v-container fluid>
        <h1>Debug page</h1>
        <p>Currently logged in as {{ username }} (this is probably wrong, issue #115)</p>
        <p>
          <v-btn @click="login('aapeli', 'Aapeli\'s password')"
            >Login as user "aapeli"</v-btn
          >
        </p>
        <p>
          <v-btn @click="loginLink('itsi')"
            >Send login link for "itsi" (check console)</v-btn
          >
        </p>
        <p>
          <v-btn @click="login('val', 'Val\'s password')"
            >Login as user "val"</v-btn
          >
        </p>
      </v-container>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { client, authClient } from "../api"
import { PingReq } from "../pb/api_pb"
import { AuthReq, LoginReq, LoginRes } from "../pb/auth_pb"
import * as grpcWeb from "grpc-web"

import Store, { AuthenticationState } from "../store"
import Router from "../router"

import { mapState } from "vuex"

export default Vue.extend({
  data: () => ({
    //
  }),

  computed: mapState(["username"]),

  methods: {
    login(username: string, password: string) {
      const req = new AuthReq()

      req.setUser(username)
      req.setPassword(password)
      authClient
        .authenticate(req)
        .then((res) => {
          console.log("logged in")
          Store.commit("auth", {
            authState: AuthenticationState.Authenticated,
            authToken: res.getToken(),
          })
          client
            .ping(new PingReq())
            .then((res) => {
              Store.commit("updateUser", {
                username: res.getUsername(),
                name: res.getName(),
                color: res.getColor(),
              })
            })
            .catch((err) => {
              console.error("Failed to ping server: ", err)
            })
        })
        .catch(console.error)
    },

    loginLink(username: string) {
      const req = new LoginReq()
      req.setUser(username)
      authClient
        .login(req)
        .then((res) => {
          switch (res.getNextStep()) {
            case LoginRes.LoginStep.NEED_PASSWORD:
              console.error("Actually need password for this user")
              break
            case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
              console.log("Sent link, check logs")
              break
            case LoginRes.LoginStep.INVALID_USER:
              console.error("Invalid user")
              break
          }
        })
        .catch(console.error)
    },
  },
})
</script>
