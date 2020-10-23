<template>
  <v-main>
    <error-alert :error="error" />
    <v-container fluid>
      <v-overlay absolute :value="loading">
        <loading-circular :loading="loading" />
      </v-overlay>
      <h1>Edit your location</h1>

      <h2>Step 1: search for your location</h2>
      <v-text-field
        autofocus
        v-model="addressQuery"
        :disabled="loading"
        :loading="loading"
        v-on:keyup.enter="searchAddress"
        name="searchAddress"
        label="Search for your address"
      ></v-text-field>

      <v-card>
        <v-list dense>
          <v-list-item-group color="primary" v-model="selectedOsmResponse">
            <v-list-item v-for="(result, index) in osmResponses" :key="index">
              <v-list-item-content>
                <v-list-item-title>{{ result.display_name }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="!osmResponses.length">
              <v-list-item-content>
                <v-list-item-title>No results.</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-card>

      <h2>Step 2: customize how your location is displayed</h2>

      <v-text-field
        autofocus
        v-model="displayAddress"
        :disabled="loading"
        :loading="displayAddressLoading"
        v-on:keyup.enter="searchAddress"
        name="displayAddress"
        label="Display address (shown to other users)"
      ></v-text-field>

      Drag the markers to indicate what will be shown to other users.

      <div style="height: 350px;">
        <l-map :zoom="zoom" :center="center" style="width: 100%; height: 100%;">
          <l-tile-layer :url="url" :attribution="attribution" />
          <l-marker
            :lat-lng.sync="trueLocation"
            :draggable="true"
            :visible="selectedOsmResponse !== null"
            :icon="homeIcon"
          >
            <l-tooltip :options="{ interactive: true }">
              <div>
                Searched location
              </div>
            </l-tooltip>
          </l-marker>
          <l-circle
            :lat-lng.sync="displayLocation"
            :radius="displayRadius"
            :visible="selectedOsmResponse !== null && !showTrueLocation"
          />
          <l-marker
            :lat-lng.sync="displayLocation"
            :draggable="true"
            :visible="selectedOsmResponse !== null && !showTrueLocation"
          >
            <l-tooltip :options="{ interactive: true }">
              <div>
                Location displayed to other users
              </div>
            </l-tooltip>
          </l-marker>
        </l-map>
      </div>

      <v-slider
        v-show="selectedOsmResponse !== null && !showTrueLocation"
        v-model="displayRadius"
        label="Approximate location radius"
        max="2000"
        min="50"
      ></v-slider>

      <p>
        We will only store the location and radius of your pin and your display
        address.
      </p>

      <v-btn class="mx-2 my-2" v-on:click="save" color="success">Save</v-btn>
      <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning"
        >Cancel</v-btn
      >
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { mapState } from "vuex"

import ErrorAlert from "../components/ErrorAlert.vue"
import LoadingCircular from "../components/LoadingCircular.vue"

import axios from "axios"

import L, { latLng, icon } from "leaflet"
import { LMap, LTileLayer, LMarker, LTooltip, LCircle } from "vue2-leaflet"
import "leaflet/dist/leaflet.css"

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
})

const nominatimURL = "https://nominatim.openstreetmap.org/"

export default Vue.extend({
  data: () => ({
    loading: false,
    error: null as Error | null,

    displayAddress: "",
    displayAddressLoading: false,
    osmSemiUniqueId: "",
    displayRadius: 500, // m?

    addressQuery: "" as string,
    osmResponses: [] as Array<object>,
    selectedOsmResponse: null as number | null,

    showTrueLocation: false,

    zoom: 15,
    center: latLng(0, 0),
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    trueLocation: latLng(0, 0),
    trueLocationVisible: true,
    displayLocation: latLng(0, 0),
    displayLocationVisible: false,

    homeIcon: icon({
      iconUrl: "/home-solid.png",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      shadowSize: [26, 26],
    }),
  }),

  components: {
    LMap,
    LTileLayer,
    LMarker,
    LCircle,
    LTooltip,
    ErrorAlert,
    LoadingCircular,
  },

  watch: {
    async selectedOsmResponse(to, from) {
      if (to !== undefined && to !== null) {
        const selected = this.osmResponses[to]

        this.center = latLng(selected.lat, selected.lon)
        this.trueLocation = latLng(selected.lat, selected.lon)
        // give them a random location within random angle and distance randomly between 50m - 500m from current location
        // this is not truely uniformly random in the circle, but close enough
        const angle = Math.random() * 2 * 3.1415
        const distance = Math.random() * 400 + 100
        // see https://gis.stackexchange.com/a/2964
        // 111111 m ~ 1 degree
        const latOffset = (1 / 111111) * (distance * Math.cos(angle))
        const lonOffset = (1 / 111111) * (distance * Math.sin(angle))
        this.displayLocation = latLng(
          parseFloat(selected.lat) + latOffset,
          parseFloat(selected.lon) + lonOffset
        )

        this.zoom = 15

        this.osmSemiUniqueId = selected.osm_type.toLowerCase() + selected.osm_id

        const nominatimId = selected.osm_type[0].toUpperCase() + selected.osm_id

        this.displayAddressLoading = true
        const res = await axios.get(
          nominatimURL +
            "lookup?format=jsonv2&osm_ids=" +
            encodeURIComponent(nominatimId)
        )

        // `res` contains a bunch of stuff, and the structure depends on country and completeness of data
        // so let's just try to get (neighbourhood, suburb, city, country)

        const fields = ["neighbourhood", "suburb", "city", "country"]

        const results = []

        for (const ix in fields) {
          const field = fields[ix]
          try {
            if (field in res.data[0].address) {
              results.push(res.data[0].address[field])
            }
          } catch (e) {
            console.error(e)
          }
        }

        this.displayAddress = results.join(", ")

        this.displayAddressLoading = false
      }
    },

    showTrueLocation(to, from) {
      if (to == true) {
        this.displayLocationVisible = false
      } else {
        this.displayLocationVisible = true
      }
    },
  },

  methods: {
    async searchAddress() {
      this.loading = true
      const res = await axios.get(
        nominatimURL +
          "search?format=jsonv2&q=" +
          encodeURIComponent(this.addressQuery)
      )
      this.selectedOsmResponse = null
      this.osmResponses = res.data
      this.loading = false
    },

    save() {
      // TODO
    },

    cancel() {
      // should probably just redirect back
    },
  },

  computed: {
    ...mapState(["user"]),
  },
})
</script>
