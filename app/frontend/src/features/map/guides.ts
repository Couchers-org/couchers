import { Map as MaplibreMap } from "maplibre-gl";

const URL = process.env.REACT_APP_API_BASE_URL;

export const sources = {
  guides: {
    type: "geojson",
    data: URL + "/geojson/guides",
  },
};

export const layers = {
  guideLayer: {
    id: "guide-points",
    source: "guides",
    type: "circle",
    paint: {
      "circle-color": "#8511d9",
      "circle-radius": 8,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  },
};

export const addGuidesToMap = (
  map: MaplibreMap,
  guideClickedCallback?: (ev: any) => void
) => {
  map.addSource("guides", sources["guides"] as any);
  map.addLayer(layers["guideLayer"] as any);

  if (guideClickedCallback) {
    map.on("click", layers["guideLayer"].id, guideClickedCallback);
  }
};

export default addGuidesToMap;
