import { Map as MaplibreMap } from "maplibre-gl";

const URL = process.env.REACT_APP_API_BASE_URL;

export const sources = {
  communities: {
    type: "geojson",
    data: URL + "/geojson/communities",
  },
};

export const layers = {
  communitiesLayer: {
    id: "communities-layer",
    source: "communities",
    type: "fill",
    paint: {
      "fill-color": "#cebf8e",
      "fill-opacity": 0.2,
    },
  },
};

export const addCommunitiesToMap = (map: MaplibreMap) => {
  map.addSource("communities", sources["communities"] as any);
  map.addLayer(layers["communitiesLayer"] as any);
};

export default addCommunitiesToMap;
