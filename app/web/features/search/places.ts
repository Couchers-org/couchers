import {
  AnyLayer,
  AnySourceData,
  EventData,
  Map as MaplibreMap,
  MapLayerEventType,
} from "maplibre-gl";

const URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const sources: Record<string, AnySourceData> = {
  places: {
    data: URL + "/geojson/places",
    type: "geojson",
  },
};

export const layers: Record<string, AnyLayer> = {
  placeLayer: {
    id: "place-points",
    paint: {
      "circle-color": "#d85a11",
      "circle-radius": 8,
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 1,
    },
    source: "places",
    type: "circle",
  },
};

export const addPlacesToMap = (
  map: MaplibreMap,
  placeClickedCallback?: (ev: MapLayerEventType["click"] & EventData) => void
) => {
  map.addSource("places", sources["places"]);
  map.addLayer(layers["placeLayer"]);

  if (placeClickedCallback) {
    map.on("click", layers["placeLayer"].id, placeClickedCallback);
  }
};

export default addPlacesToMap;
