import { theme } from "@/theme";

const URL = (process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL)!;

type SourceKeys = "clusteredUsers";
export const sources: Record<SourceKeys, any> = {
  clusteredUsers: {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    data: URL + "/geojson/users",
    promoteId: "id",
    type: "geojson",
  },
};

type LayerKeys = "clusterCountLayer" | "clusterLayer" | "unclusteredPointLayer";
export const layers: Record<LayerKeys, any> = {
  clusterCountLayer: {
    filter: ["has", "point_count"],
    id: "clusters-count",
    layout: {
      textField: "{point_count_abbreviated}",
      textSize: 12,
      textFont: ["Inter 28pt SemiBold"],
    },
    paint: {
      textColor: [
        "step",
        ["get", "point_count"],
        theme.palette.primary.light,
        100,
        theme.palette.primary.main,
        750,
        theme.palette.primary.dark,
      ],
    },
    source: "clusteredUsers",
    type: "symbol",
  },
  clusterLayer: {
    filter: ["has", "point_count"],
    id: "clusters",
    paint: {
      // step expression: https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/#step
      circleColor: [
        "step",
        ["get", "point_count"],
        theme.palette.primary.light,
        100,
        theme.palette.primary.main,
        750,
        theme.palette.primary.dark,
      ],
      circleRadius: ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    },
    source: "clusteredUsers",
    type: "circle",
  },
  unclusteredPointLayer: {
    filter: ["!", ["has", "point_count"]],
    id: "unclustered-points",
    paint: {
      iconColor: [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        ["literal", "#e47701"],
        ["literal", "#767676"]
      ],
      iconHaloWidth: 2,
      iconHaloColor: [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        ["literal", "#e47701"],
        ["literal", "#767676"]
      ],
      iconHaloBlur: 2,
    },
    source: "clusteredUsers",
    type: "symbol",
  },
};
