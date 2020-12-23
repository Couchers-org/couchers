import { Map as MapboxMap } from "mapbox-gl";
import { URL } from "../../service/client";

export const sources = {
  "clustered-users": {
    type: "geojson",
    data: URL + "/geojson/users",
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  },
};

export const layers = {
  clusterLayer: {
    id: "clusters",
    source: "clustered-users",
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
    source: "clustered-users",
    type: "symbol",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
    },
  },
  unclusteredPointLayer: {
    id: "unclustered-points",
    source: "clustered-users",
    type: "circle",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 8,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  },
};

export const addClusteredUsersToMap = (map: MapboxMap) => {
  map.addSource("clustered-users", sources["clustered-users"] as any);
  map.addLayer(layers["clusterLayer"] as any);
  map.addLayer(layers["clusterCountLayer"] as any);
  map.addLayer(layers["unclusteredPointLayer"] as any);
};

export default addClusteredUsersToMap;
