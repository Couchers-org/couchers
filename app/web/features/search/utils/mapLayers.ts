import { LayerProps } from "react-map-gl/maplibre";
import { theme } from "theme";

const CLUSTER_LAYER_ID = "clusters";
const UNCLUSTERED_LAYER_ID = "unclustered-points";
const CLUSTER_COUNT_LAYER_ID = "clusters-count";
const SOURCE_CLUSTERED_USERS_ID = "clustered-users";

const clusterLayer: LayerProps = {
  filter: ["has", "point_count"],
  id: CLUSTER_LAYER_ID,
  paint: {
    // step expression: https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/#step
    "circle-color": [
      "step",
      ["get", "point_count"],
      theme.palette.primary.light,
      100,
      theme.palette.primary.main,
      750,
      theme.palette.primary.dark,
    ],
    "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
  },
  source: SOURCE_CLUSTERED_USERS_ID,
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
      theme.palette.getContrastText(theme.palette.primary.light),
      100,
      theme.palette.getContrastText(theme.palette.primary.main),
      750,
      theme.palette.getContrastText(theme.palette.primary.dark),
    ],
  },
  source: SOURCE_CLUSTERED_USERS_ID,
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
      theme.palette.secondary.main,
      ["==", ["get", "hasCompletedProfile"], true],
      theme.palette.primary.main,
      theme.palette.grey[500],
    ],
    "icon-halo-width": 2,
    "icon-halo-color": [
      "case",
      ["boolean", ["feature-state", "selected"], false],
      theme.palette.secondary.main,
      ["==", ["get", "hasCompletedProfile"], true],
      theme.palette.primary.main,
      theme.palette.grey[500],
    ],
    "icon-halo-blur": 2,
  },
  source: SOURCE_CLUSTERED_USERS_ID,
  type: "symbol",
};

export {
  CLUSTER_COUNT_LAYER_ID,
  CLUSTER_LAYER_ID,
  clusterCountLayer,
  clusterLayer,
  SOURCE_CLUSTERED_USERS_ID,
  UNCLUSTERED_LAYER_ID,
  unclusteredPointLayer,
};
