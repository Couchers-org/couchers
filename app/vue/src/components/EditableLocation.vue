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

          <v-list dense>
            <v-list-item-group color="primary" v-model="selectedOsmResponse">
              <v-list-item v-for="(result, index) in osmResponses" :key="index">
                <v-list-item-content>
                  <v-list-item-title>{{
                    result.display_name
                  }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item v-if="!osmResponses.length">
                <v-list-item-content>
                  <v-list-item-title
                    >No results yet. Click "Search" to search for
                    addresses.</v-list-item-title
                  >
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>

          <h2>Step 2: customize how your location is displayed</h2>

          <v-text-field
            v-model="displayAddress"
            :disabled="loadingDisplayAddress"
            :loading="loadingDisplayAddress"
            v-on:keyup.enter="searchAddress"
            name="displayAddress"
            label="Display address (shown to other users)"
          ></v-text-field>

          Drag the red marker (and adjust the radius) to indicate what will be
          shown to other users. (The blue marker shows the address you searched
          for).

          <div style="height: 350px">
            <MglMap
              :accessToken="accessToken"
              :mapStyle="mapStyle"
              :zoom="zoom"
              :center="center"
            >
              <MglScaleControl position="top-right" />
              <MglNavigationControl position="top-left" />
              <!-- <MglMarker
                :coordinates="searchedLocation"
                :draggable="false"
                :visible="decorationsVisible"
                color="blue"
              >
                <MglPopup>
                  <div>Searched location</div>
                </MglPopup>
              </MglMarker> -->
              <MglMarker
                :coordinates.sync="displayLocation"
                :draggable="true"
                :visible="decorationsVisible"
                color="red"
              >
                <MglPopup>
                  <div>Location displayed to other users</div>
                </MglPopup>
              </MglMarker>
              <MglGeojsonLayer
                :sourceId="geoJsonSource.data.id"
                :source="geoJsonSource"
                :layerId="geoJsonLayer.id"
                :layer="geoJsonLayer"
              />
            </MglMap>
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
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"

import { NOMINATIM_URL, ACCESS_TOKEN } from "../api"

import axios from "axios"

import "mapbox-gl/dist/mapbox-gl.css"

import Mapbox from "mapbox-gl"
import {
  MglGeojsonLayer,
  MglMap,
  MglMarker,
  MglNavigationControl,
  MglPopup,
  MglScaleControl,
} from "vue-mapbox"

const createGeoJSONCircle = function (
  center: any,
  radius: number,
  name: string
) {
  const points = 64

  const coords = {
    latitude: center[1],
    longitude: center[0],
  }

  const distanceX =
    radius / (1000 * (111.32 * Math.cos((coords.latitude * Math.PI) / 180)))
  const distanceY = radius / (1000 * 110.574)

  const ret = []

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)

    ret.push([coords.longitude + x, coords.latitude + y])
  }
  ret.push(ret[0])

  return {
    type: "geojson",
    data: {
      id: name,
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [ret],
          },
        },
      ],
    },
  }
}

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
    MglGeojsonLayer,
    MglMap,
    MglMarker,
    MglNavigationControl,
    MglPopup,
    MglScaleControl,
  },

  created() {
    const t = this as any
    t.mapbox = Mapbox
  },

  data: () => ({
    accessToken: ACCESS_TOKEN,
    mapStyle: "mapbox://styles/mapbox/light-v10",

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

    zoom: 14,
    center: [0, 0],
    url: process.env.VUE_APP_TILE_URL,
    attribution: process.env.VUE_APP_TILE_ATTRIBUTION,
    searchedLocation: [0, 0],
    displayLocation: [0, 0],

    geoJsonSource: createGeoJSONCircle([0, 0], 500, "circle"),
    geoJsonLayer: {
      id: "circle",
      type: "fill",
      paint: {
        "fill-color": "gray",
        "fill-opacity": 0.4,
      },
    },
  }),

  watch: {
    displayRadius(to, from) {
      this.updateCircle()
    },

    displayLocation(to, from) {
      this.updateCircle()
    },

    async selectedOsmResponse(to, from) {
      if (to !== undefined && to !== null) {
        const selected = this.osmResponses[to] as any

        this.searchedLocation = [selected.lon, selected.lat]
        // give them a random location within random angle and distance randomly between 50m - 500m from current location
        // this is not truely uniformly random in the circle, but close enough
        const angle = Math.random() * 2 * 3.1415
        const distance =
          (Math.random() * this.displayRadius * 4) / 5 + this.displayRadius / 5
        // see https://gis.stackexchange.com/a/2964
        // 111111 m ~ 1 degree
        const latOffset = (1 / 111111) * (distance * Math.cos(angle))
        const lonOffset = (1 / 111111) * (distance * Math.sin(angle))

        this.displayLocation = [
          parseFloat(selected.lon) + lonOffset,
          parseFloat(selected.lat) + latOffset,
        ]

        this.zoom = 14
        this.center = this.displayLocation

        const nominatimId = selected.osm_type[0].toUpperCase() + selected.osm_id

        this.loadingDisplayAddress = true
        const res = await axios.get(
          NOMINATIM_URL +
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
    updateCircle() {
      this.geoJsonSource = createGeoJSONCircle(
        this.displayLocation,
        this.displayRadius,
        "circle"
      )
    },

    async searchAddress() {
      this.loadingAddressQuery = true
      const res = await axios.get(
        NOMINATIM_URL +
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
      this.displayLocation = [this.longitude, this.latitude]
      this.center = [this.longitude, this.latitude]
      this.displayRadius = this.radius
    },

    async saveLocation() {
      this.savingLocation = true
      await this.save(
        this.displayAddress,
        this.displayLocation[1],
        this.displayLocation[0],
        this.displayRadius
      )
      this.savingLocation = false
      this.dialog = false
    },

    cancel() {
      // stop editing and set text back to original
      this.dialog = false
      this.displayAddress = this.address
      this.displayLocation = [this.longitude, this.latitude]
      this.displayRadius = this.radius
    },
  },
})
</script>
