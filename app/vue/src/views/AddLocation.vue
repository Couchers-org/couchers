<template>
  <v-main>
    <v-container fluid>
      <error-alert :error="error" />
      <h1>Add a location</h1>
      <editable-location
        address="Select a location"
        :latitude="0.0"
        :longitude="0.0"
        :radius="500"
        :save="saveLocation"
      />
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { jailClient } from "../api"
import { SetLocationReq } from "../pb/jail_pb"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import Store from "../store"
import Router from "../router"
import ErrorAlert from "../components/ErrorAlert.vue"
import EditableLocation from "../components/EditableLocation.vue"

export default Vue.extend({
  data: () => ({
    loading: true,
    error: null as Error | null,
    successMessages: [] as Array<string>,
    accept: false,
    acceptedTos: false,
  }),

  components: {
    EditableLocation,
    ErrorAlert,
  },

  created() {
    this.fetchData()
  },

  methods: {
    async fetchData() {
      const res = await jailClient.jailInfo(new Empty())
      if (!res.getJailed()) {
        Router.push({
          name: "Home",
        })
      }
      this.loading = false
    },

    async saveLocation(
      address: string,
      latitude: number,
      longitude: number,
      radius: number
    ) {
      console.log(address, latitude, longitude, radius)
      const req = new SetLocationReq()
      req.setCity(address)
      req.setLat(latitude)
      req.setLng(longitude)
      req.setRadius(radius)
      const res = await jailClient.setLocation(req)
      if (!res.getHasNotAddedLocation()) {
        Store.dispatch("ping")
      }
    },
  },
})
</script>
