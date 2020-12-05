<template>
  <v-main>
    <div class="mx-0" style="width: 100%; height: 100%">
      <error-alert :error="error" />
      <MglMap :accessToken="accessToken" :mapStyle="mapStyle">
        <MglScaleControl />
        <MglGeojsonLayer
          sourceId="users"
          :source="usersSource"
          layerId="clusters"
          :layer="clusterLayer"
        />
        <MglGeojsonLayer
          sourceId="users"
          :source="usersSource"
          layerId="clusters-count"
          :layer="clusterCountLayer"
        />
        <MglGeojsonLayer
          sourceId="users"
          :source="usersSource"
          layerId="unclustered-points"
          :layer="unclusteredPointLayer"
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
    usersSource: {
      type: "geojson",
      data: URL + "/geojson/users",
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    },
    clusterLayer: {
      id: "clusterLayer",
      type: "circle",
      filter: ["has", "point_count"],
      paint: {
        // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
        // with three steps to implement three types of circles:
        //   * Blue, 20px circles when point count is less than 100
        //   * Yellow, 30px circles when point count is between 100 and 750
        //   * Pink, 40px circles when point count is greater than or equal to 750
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#51bbd6",
          100,
          "#f1f075",
          750,
          "#f28cb1",
        ],
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
      },
    },
    clusterCountLayer: {
      id: "clusters-count",
      type: "symbol",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-size": 12,
      },
    },
    unclusteredPointLayer: {
      id: "unclustered-points",
      type: "circle",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#11b4da",
        "circle-radius": 8,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
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
