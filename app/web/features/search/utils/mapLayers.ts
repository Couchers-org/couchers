import { LayerProps } from "react-map-gl/maplibre";

const CLUSTER_LAYER_ID = "clusters";
const UNCLUSTERED_LAYER_ID = "unclustered-points";
const CLUSTER_COUNT_LAYER_ID = "clusters-count";
const USERS_SOURCE_ID = "users-source";

// Theme colors hardcoded for static layer configuration
const PRIMARY_LIGHT = "#6bc4a6";
const PRIMARY_MAIN = "#00a398";
const PRIMARY_DARK = "#20686c";
const SECONDARY_MAIN = "#e47701";
const GREY_500 = "#767676";

const clusterLayer: LayerProps = {
  filter: ["has", "point_count"],
  id: CLUSTER_LAYER_ID,
  paint: {
    // step expression: https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/#step
    "circle-color": [
      "step",
      ["get", "point_count"],
      PRIMARY_LIGHT,
      100,
      PRIMARY_MAIN,
      750,
      PRIMARY_DARK,
    ],
    "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
  },
  source: USERS_SOURCE_ID,
  type: "circle",
};

const clusterCountLayer: LayerProps = {
  filter: ["has", "point_count"],
  id: CLUSTER_COUNT_LAYER_ID,
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-size": 12,
    "text-font": ["Inter 28pt SemiBold"],
  },
  paint: {
    "text-color": [
      "step",
      ["get", "point_count"],
      "#313539", // contrast text for primary.light
      100,
      "#fcfcfc", // contrast text for primary.main
      750,
      "#fcfcfc", // contrast text for primary.dark
    ],
  },
  source: USERS_SOURCE_ID,
  type: "symbol",
};

const unclusteredPointLayer: LayerProps = {
  filter: ["!", ["has", "point_count"]],
  id: UNCLUSTERED_LAYER_ID,
  layout: {
    "icon-image": "user-pin",
    "icon-anchor": "bottom",
    "icon-allow-overlap": true,
  },
  paint: {
    "icon-color": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      SECONDARY_MAIN,
      ["==", ["get", "hasCompletedProfile"], true],
      PRIMARY_MAIN,
      GREY_500,
    ],
    "icon-halo-width": 2,
    "icon-halo-color": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      SECONDARY_MAIN,
      ["==", ["get", "hasCompletedProfile"], true],
      PRIMARY_MAIN,
      GREY_500,
    ],
    "icon-halo-blur": 2,
  },
  source: USERS_SOURCE_ID,
  type: "symbol",
};

export {
  clusterCountLayer,
  clusterLayer,
  UNCLUSTERED_LAYER_ID,
  unclusteredPointLayer,
  USERS_SOURCE_ID,
};
