import { Map as MaplibreMap } from "maplibre-gl";

const URL = process.env.REACT_APP_API_BASE_URL;

export const sources = {
  "pages": {
    type: "geojson",
    data: URL + "/geojson/pages",
  },
};

export const layers = {
  pageLayer: {
    id: "page-points",
    source: "pages",
    type: "circle",
    paint: {
      "circle-color": "#d85a11",
      "circle-radius": 8,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  },
};

export const addPagesToMap = (
  map: MaplibreMap,
  pageClickedCallback?: (ev: any) => void
) => {
  map.addSource("pages", sources["pages"] as any);
  map.addLayer(layers["pageLayer"] as any);

  if (pageClickedCallback) {
    map.on("click", layers["pageLayer"].id, pageClickedCallback);
  }
};

export default addPagesToMap;
