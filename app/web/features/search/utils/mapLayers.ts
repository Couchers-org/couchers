import { LayerSpecification } from "maplibre-gl";
import { theme } from "theme";

type LayerKeys = "clusterCountLayer" | "clusterLayer" | "unclusteredPointLayer";

const layers: Record<LayerKeys, LayerSpecification> = {
  clusterCountLayer: {
    filter: ["has", "point_count"],
    id: "clusters-count",
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
    source: "clustered-users",
    type: "symbol",
  },
  clusterLayer: {
    filter: ["has", "point_count"],
    id: "clusters",
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
    source: "clustered-users",
    type: "circle",
  },
  unclusteredPointLayer: {
    filter: ["!", ["has", "point_count"]],
    id: "unclustered-points",
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
        ["==", ["get", "has_completed_profile"], true],
        theme.palette.primary.main,
        theme.palette.grey[500],
      ],
      "icon-halo-width": 2,
      "icon-halo-color": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        theme.palette.secondary.main,
        ["==", ["get", "has_completed_profile"], true],
        theme.palette.primary.main,
        theme.palette.grey[500],
      ],
      "icon-halo-blur": 2,
    },
    source: "clustered-users",
    type: "symbol",
  },
};

export { layers };
