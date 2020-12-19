<template>
  <v-main>
    <div class="mx-0 my-0" style="width: 100%; height: 100%">
      <MglMap
        :accessToken="accessToken"
        :mapStyle="mapStyle"
        :transformRequest="transformRequest"
      >
        <MglScaleControl position="top-right" />
        <MglNavigationControl position="top-left" />
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
          @click="clickedUser"
        />
      </MglMap>
    </div>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import Store from "../store"
import Router from "../router"

import "mapbox-gl/dist/mapbox-gl.css"

import { URL, ACCESS_TOKEN } from "../api"

import Mapbox from "mapbox-gl"
import {
  MglGeojsonLayer,
  MglMap,
  MglNavigationControl,
  MglScaleControl,
} from "vue-mapbox"

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
    MglGeojsonLayer,
    MglMap,
    MglNavigationControl,
    MglScaleControl,
  },

  methods: {
    transformRequest(url: string, resourceType: string) {
      if (url.startsWith(URL)) {
        return {
          url: url,
          credentials: "include",
        }
      }
    },

    clickedUser(event: any) {
      const username = event.mapboxEvent.features[0].properties.username
      Router.push({ name: "User", params: { user: username } })
    },
  },
})
</script>
