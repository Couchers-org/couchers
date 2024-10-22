import {
  LayerSpecification,
  Map as MaplibreMap,
  SourceSpecification,
} from "maplibre-gl";

const URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const sources: Record<string, SourceSpecification> = {
  communities: {
    data: URL + "/geojson/communities",
    type: "geojson",
  },
};

export const layers: Record<string, LayerSpecification> = {
  communitiesLayer: {
    id: "communities-layer",
    paint: {
      "fill-color": "#cebf8e",
      "fill-opacity": 0.2,
    },
    source: "communities",
    type: "fill",
  },
};

export const addCommunitiesToMap = (map: MaplibreMap) => {
  map.addSource("communities", sources["communities"]);
  map.addLayer(layers["communitiesLayer"]);
};

export default addCommunitiesToMap;
