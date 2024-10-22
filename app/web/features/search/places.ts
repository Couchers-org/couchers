import {
  LayerSpecification,
  Map as MaplibreMap,
  MapMouseEvent,
  SourceSpecification,
} from "maplibre-gl";

const URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const sources: Record<string, SourceSpecification> = {
  places: {
    data: URL + "/geojson/places",
    type: "geojson",
  },
};

export const layers: Record<string, LayerSpecification> = {
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
  placeClickedCallback?: (ev: MapMouseEvent) => void
) => {
  map.addSource("places", sources["places"]);
  map.addLayer(layers["placeLayer"]);

  if (placeClickedCallback) {
    map.on("click", layers["placeLayer"].id, placeClickedCallback);
  }
};

export default addPlacesToMap;
