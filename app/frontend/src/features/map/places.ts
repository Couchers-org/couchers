import { Map as MaplibreMap } from "maplibre-gl";

const URL = process.env.REACT_APP_API_BASE_URL;

export const sources = {
  places: {
    type: "geojson",
    data: URL + "/geojson/places",
  },
};

export const layers = {
  placeLayer: {
    id: "place-points",
    source: "places",
    type: "circle",
    paint: {
      "circle-color": "#d85a11",
      "circle-radius": 8,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  },
};

export const addPlacesToMap = (
  map: MaplibreMap,
  placeClickedCallback?: (ev: any) => void
) => {
  map.addSource("places", sources["places"] as any);
  map.addLayer(layers["placeLayer"] as any);

  if (placeClickedCallback) {
    map.on("click", layers["placeLayer"].id, placeClickedCallback);
  }
};

export default addPlacesToMap;
