<template>
  <v-main>
    <v-container fill-height>
      <v-container fluid>
        <h1>Debug page</h1>
        <p>
          Currently logged in as {{ user ? user.username : "not logged in" }}
        </p>
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
import { AuthReq, LoginReq, LoginRes } from "../pb/auth_pb"

import Store from "../store"
import Router from "../router"

import { mapState } from "vuex"

export default Vue.extend({
  data: () => ({
    //
  }),

  computed: mapState(["user"]),

  methods: {
    async login(username: string, password: string) {
      const req = new AuthReq()

      req.setUser(username)
      req.setPassword(password)
      try {
        const res = await authClient.authenticate(req)
        console.debug("Logged in")
        Store.dispatch("auth", res)
      } catch (err) {
        console.error(err)
      }
    },

    async loginLink(username: string) {
      const req = new LoginReq()
      req.setUser(username)
      try {
        const res = await authClient.login(req)
        switch (res.getNextStep()) {
          case LoginRes.LoginStep.NEED_PASSWORD:
            console.error("Actually need password for this user")
            break
          case LoginRes.LoginStep.SENT_LOGIN_EMAIL:
            console.debug("Sent link, check logs")
            break
          case LoginRes.LoginStep.INVALID_USER:
            console.error("Invalid user")
            break
        }
      } catch (err) {
        console.error(err)
      }
    },
  },
})
</script>
