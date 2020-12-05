<template>
  <v-main>
    <div class="mx-0" style="width: 100%; height: 100%">
      <error-alert :error="error" />
      <MglMap :accessToken="accessToken" :mapStyle="mapStyle">
        <MglScaleControl />
        <MglGeojsonLayer
          sourceId="usersSourceId"
          :source="usersSource"
          layerId="usersLayerId"
          :layer="usersLayer"
        />
      </MglMap>
    </div>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import Store from "../store"
import Router from "../router"
import ErrorAlert from "../components/ErrorAlert.vue"

import "mapbox-gl/dist/mapbox-gl.css"

import { URL } from "../api"

import Mapbox from "mapbox-gl"
import {
  MglMap,
  MglMarker,
  MglScaleControl,
  MglGeojsonLayer,
  MglPopup,
} from "vue-mapbox"

const ACCESS_TOKEN =
  "pk.eyJ1IjoiY291Y2hlcnMiLCJhIjoiY2tpYnJtNjlpMHYzMzJxbWd5anIyNXg0YSJ9.mfpO3-lIzJZNu5-hUUdsRQ"

export default Vue.extend({
  data: () => ({
    accessToken: ACCESS_TOKEN,
    mapStyle: "mapbox://styles/mapbox/light-v10",

    error: null as Error | null,
    usersSource: { type: "geojson", data: URL + "/geojson/users" },
    usersLayer: {
      id: "usersLayerId",
      type: "circle",
      paint: {
        "circle-radius": 5,
        "circle-color": "red",
        "circle-opacity": 0.4,
      },
    },
  }),

  components: {
    MglMap,
    MglScaleControl,
    MglGeojsonLayer,
    ErrorAlert,
  },

  created() {
    //
  },

  methods: {
    //
  },
})
</script>
