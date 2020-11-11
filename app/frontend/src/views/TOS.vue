<template>
  <v-main>
    <v-container fluid>
      <error-alert :error="error" />
      <h1>Terms of Service</h1>
      <p>Please accept the TOS before continuing to Couchers.org</p>
      <p>I understand Couchers.org is not a dating platform, etc, etc.</p>
      <v-checkbox v-model="accept" label="I accept the Terms of Service" />
      <v-btn
        :loading="loading"
        :disabled="acceptedTos"
        v-on:click="acceptTos"
        >{{ acceptedTos ? "Already accpeted" : "Accept" }}</v-btn
      >
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { jailClient } from "../api"
import { AcceptTOSReq } from "../pb/jail_pb"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import Store from "../store"
import Router from "../router"
import ErrorAlert from "../components/ErrorAlert.vue"

export default Vue.extend({
  data: () => ({
    loading: true,
    error: null as Error | null,
    successMessages: [] as Array<string>,
    accept: false,
    acceptedTos: false,
  }),

  components: {
    ErrorAlert,
  },

  created() {
    this.fetchData()
  },

  methods: {
    async fetchData() {
      const res = await jailClient.getTOS(new Empty())
      this.acceptedTos = res.getAcceptedTos()
      this.accept = res.getAcceptedTos()
      this.loading = false
    },
    async acceptTos() {
      this.loading = true
      const req = new AcceptTOSReq()
      req.setAccept(true)
      const res = await jailClient.acceptTOS(req)
      if (res.getAcceptedTos()) {
        Store.dispatch("ping")
      }
    },
  },
})
</script>
