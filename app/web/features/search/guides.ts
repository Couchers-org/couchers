import {
  AnyLayer,
  AnySourceData,
  EventData,
  Map as MaplibreMap,
  MapLayerEventType,
} from "maplibre-gl";

const URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const sources: Record<string, AnySourceData> = {
  guides: {
    data: URL + "/geojson/guides",
    type: "geojson",
  },
};

export const layers: Record<string, AnyLayer> = {
  guideLayer: {
    id: "guide-points",
    paint: {
      "circle-color": "#8511d9",
      "circle-radius": 8,
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1,
    },
    source: "guides",
    type: "circle",
  },
};

export const addGuidesToMap = (
  map: MaplibreMap,
  guideClickedCallback?: (ev: MapLayerEventType["click"] & EventData) => void
) => {
  map.addSource("guides", sources["guides"]);
  map.addLayer(layers["guideLayer"]);

  if (guideClickedCallback) {
    map.on("click", layers["guideLayer"].id, guideClickedCallback);
  }
};

export default addGuidesToMap;
