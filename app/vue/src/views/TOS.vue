<template>
  <v-main>
    <v-container fluid>
      <error-alert :error="error" />
      <h1>Terms of Service</h1>
      <p>Please accept the TOS before continuing to Couchers.org</p>
      <p>
        This is a test TOS. I agree to follow the
        <a href="https://community.couchers.org/faq">Couchers guidelines</a>. I
        understand this is a preview of couchers.org and my data may be erased.
      </p>
      <v-checkbox v-model="accept" label="I accept the Terms of Service" />
      <v-btn
        :loading="loading"
        :disabled="acceptedTos"
        v-on:click="acceptTos"
        >{{ acceptedTos ? "Already accepted" : "Accept" }}</v-btn
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
      const res = await jailClient.jailInfo(new Empty())
      this.acceptedTos = !res.getHasNotAcceptedTos()
      this.accept = !res.getHasNotAcceptedTos()
      this.loading = false
    },
    async acceptTos() {
      this.loading = true
      const req = new AcceptTOSReq()
      req.setAccept(this.accept)
      const res = await jailClient.acceptTOS(req)
      if (!res.getHasNotAcceptedTos()) {
        Store.dispatch("ping")
      }
    },
  },
})
</script>
