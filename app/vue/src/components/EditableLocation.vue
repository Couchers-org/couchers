<template>
  <div>
    <div>
      <p>
        {{ address }}
        <v-btn icon v-on:click="edit"><v-icon>mdi-pencil</v-icon></v-btn>
      </p>
    </div>
    <v-dialog v-model="dialog">
      <v-card>
        <v-card-title class="headline">Update your location</v-card-title>
        <v-card-text>
          <h2>Step 1: search for your location</h2>
          <v-text-field
            autofocus
            v-model="addressQuery"
            :disabled="loadingAddressQuery"
            :loading="loadingAddressQuery"
            v-on:keyup.enter="searchAddress"
            name="searchAddress"
            label="Search for your address"
          ></v-text-field>

          <v-btn @click="searchAddress" :loading="loadingAddressQuery"
            >Search</v-btn
          >

          <v-card>
            <v-list dense>
              <v-list-item-group color="primary" v-model="selectedOsmResponse">
                <v-list-item
                  v-for="(result, index) in osmResponses"
                  :key="index"
                >
                  <v-list-item-content>
                    <v-list-item-title>{{
                      result.display_name
                    }}</v-list-item-title>
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
            v-model="displayAddress"
            :disabled="loadingDisplayAddress"
            :loading="loadingDisplayAddress"
            v-on:keyup.enter="searchAddress"
            name="displayAddress"
            label="Display address (shown to other users)"
          ></v-text-field>

          Drag the markers to indicate what will be shown to other users.

          <div style="height: 350px;">
            <l-map
              :zoom="zoom"
              :center="center"
              style="width: 100%; height: 100%;"
            >
              <l-tile-layer :url="url" :attribution="attribution" />
              <l-marker
                :lat-lng.sync="searchedLocation"
                :draggable="true"
                :visible="decorationsVisible"
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
                :visible="decorationsVisible"
              />
              <l-marker
                :lat-lng.sync="displayLocation"
                :draggable="true"
                :visible="decorationsVisible"
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
            v-show="decorationsVisible"
            v-model="displayRadius"
            label="Approximate location radius"
            max="2000"
            min="50"
          ></v-slider>

          <p>
            We will only store the location and radius of your pin and your
            display address.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="mx-2 my-2"
            v-on:click="saveLocation"
            color="success"
            :loading="savingLocation"
            >Save</v-btn
          >
          <v-btn class="mx-2 my-2" v-on:click="cancel" color="warning"
            >Cancel</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"

import axios from "axios"

import "leaflet/dist/leaflet.css"
import L, { latLng, icon } from "leaflet"
import { LMap, LTileLayer, LMarker, LTooltip, LCircle } from "vue2-leaflet"

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
})

const nominatimURL = process.env.VUE_APP_NOMINATIM_URL

type SaveCallback = (
  address: string,
  latitude: number,
  longitude: number,
  radius: number
) => Promise<void>

export default Vue.extend({
  props: {
    address: String,
    latitude: Number,
    longitude: Number,
    radius: Number,
    save: Function as PropType<SaveCallback>,
  },

  components: {
    LMap,
    LTileLayer,
    LMarker,
    LCircle,
    LTooltip,
  },

  data: () => ({
    dialog: false,

    loadingAddressQuery: false,
    loadingDisplayAddress: false,
    savingLocation: false,

    displayAddress: "",
    displayRadius: 500, // m?

    addressQuery: "" as string,
    osmResponses: [] as Array<object>,
    selectedOsmResponse: null as number | null,

    // whether to show markers/etc on map
    decorationsVisible: true,

    zoom: 15,
    center: latLng(0, 0),
    url: process.env.VUE_APP_TILE_URL,
    attribution: process.env.VUE_APP_TILE_ATTRIBUTION,
    searchedLocation: latLng(0, 0),
    displayLocation: latLng(0, 0),

    homeIcon: icon({
      iconUrl: "/home-solid.png",
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      shadowSize: [26, 26],
    }),
  }),

  watch: {
    async selectedOsmResponse(to, from) {
      if (to !== undefined && to !== null) {
        const selected = this.osmResponses[to]

        this.center = latLng(selected.lat, selected.lon)
        this.searchedLocation = latLng(selected.lat, selected.lon)
        // give them a random location within random angle and distance randomly between 50m - 500m from current location
        // this is not truely uniformly random in the circle, but close enough
        const angle = Math.random() * 2 * 3.1415
        const distance =
          (Math.random() * this.displayRadius * 4) / 5 + this.displayRadius / 5
        // see https://gis.stackexchange.com/a/2964
        // 111111 m ~ 1 degree
        const latOffset = (1 / 111111) * (distance * Math.cos(angle))
        const lonOffset = (1 / 111111) * (distance * Math.sin(angle))

        this.displayLocation = latLng(
          parseFloat(selected.lat) + latOffset,
          parseFloat(selected.lon) + lonOffset
        )

        const nominatimId = selected.osm_type[0].toUpperCase() + selected.osm_id

        this.loadingDisplayAddress = true
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

        this.loadingDisplayAddress = false
      }
    },
  },

  methods: {
    async searchAddress() {
      this.loadingAddressQuery = true
      const res = await axios.get(
        nominatimURL +
          "search?format=jsonv2&q=" +
          encodeURIComponent(this.addressQuery)
      )
      this.selectedOsmResponse = null
      this.osmResponses = res.data
      this.loadingAddressQuery = false
    },

    edit() {
      this.dialog = true
      this.displayAddress = this.address
      this.displayLocation = latLng(this.latitude, this.longitude)
      this.center = latLng(this.latitude, this.longitude)
      this.displayRadius = this.radius
    },

    async saveLocation() {
      this.savingLocation = true
      await this.save(
        this.displayAddress,
        this.displayLocation.lat,
        this.displayLocation.lng,
        this.displayRadius
      )
      this.savingLocation = false
      this.dialog = false
    },

    cancel() {
      // stop editing and set text back to original
      this.dialog = false
      this.displayAddress = this.address
      this.displayLocation = latLng(this.latitude, this.longitude)
      this.displayRadius = this.radius
    },
  },
})
</script>
