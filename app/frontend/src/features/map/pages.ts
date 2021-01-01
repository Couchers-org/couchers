import { Map as MapboxMap } from "mapbox-gl";

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
  map: MapboxMap
) => {
  map.addSource("pages", sources["pages"] as any);
  map.addLayer(layers["pageLayer"] as any);
};

export default addPagesToMap;
