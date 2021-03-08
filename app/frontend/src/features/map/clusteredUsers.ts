import { Map as MaplibreMap } from "maplibre-gl";

const URL = process.env.REACT_APP_API_BASE_URL;

export const sources = {
  "clustered-users": {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    data: URL + "/geojson/users",
    type: "geojson",
  },
};

export const layers = {
  clusterCountLayer: {
    filter: ["has", "point_count"],
    id: "clusters-count",
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
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
        "#51bbd6",
        100,
        "#f1f075",
        750,
        "#f28cb1",
      ],
      "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    },
    source: "clustered-users",
    type: "circle",
  },
  unclusteredPointLayer: {
    filter: ["!", ["has", "point_count"]],
    id: "unclustered-points",
    paint: {
      "circle-color": "#11b4da",
      "circle-radius": 8,
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1,
    },
    source: "clustered-users",
    type: "circle",
  },
};

export const addClusteredUsersToMap = (
  map: MaplibreMap,
  userClickedCallback?: (ev: any) => void
) => {
  map.addSource("clustered-users", sources["clustered-users"] as any);
  map.addLayer(layers["clusterLayer"] as any);
  map.addLayer(layers["clusterCountLayer"] as any);
  map.addLayer(layers["unclusteredPointLayer"] as any);
  if (userClickedCallback) {
    map.on("click", layers["unclusteredPointLayer"].id, userClickedCallback);
  }
};

export default addClusteredUsersToMap;
