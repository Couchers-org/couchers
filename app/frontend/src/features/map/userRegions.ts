import { Map as MapboxMap } from "mapbox-gl";

export const sources = {
  "regions-source": {
    type: "geojson",
    data: "/regions.geojson",
  },
};

const layers = (
    theme: any,
    visited: Array<String>,
    lived: Array<String>,
    surfed: Array<String>,
    hosted: Array<String>,
  ) => {
  return {
    allLayer: {
      id: "all-layer",
      source: "regions-source",
      type: "fill",
      paint: {
        "fill-color": "#fff",
        "fill-opacity": 1
      },
    },
    visitedLayer: {
      id: "visited-layer",
      source: "regions-source",
      type: "fill",
      filter: ["in", ["get", "region"], ["literal", visited]],
      paint: {
        "fill-color": theme.palette.primary.main,
        "fill-opacity": 0.6
      },
    },
    livedLayer: {
      id: "lived-layer",
      source: "regions-source",
      type: "fill",
      filter: ["in", ["get", "region"], ["literal", lived]],
      paint: {
        "fill-color": theme.palette.primary.main,
        "fill-opacity": 0.6
      },
    },
    surfedLayer: {
      id: "surfed-layer",
      source: "regions-source",
      type: "fill",
      filter: ["in", ["get", "region"], ["literal", surfed]],
      paint: {
        "fill-color": theme.palette.primary.main,
        "fill-opacity": 0.6
      },
    },
    hostedLayer: {
      id: "hosted-layer",
      source: "regions-source",
      type: "fill",
      filter: ["in", ["get", "region"], ["literal", hosted]],
      paint: {
        "fill-color": theme.palette.primary.main,
        "fill-opacity": 0.6
      },
    },
  }
};

export const addUserRegionsToMap = (
  map: MapboxMap,
    theme: any,
    visited: Array<String>,
  lived: Array<String>,
  surfed: Array<String>,
  hosted: Array<String>
) => {
  const customLayers = layers(theme, visited, lived, surfed, hosted)
  map.addSource("regions-source", sources["regions-source"] as any);
  map.addLayer(customLayers["allLayer"] as any);
  map.addLayer(customLayers["visitedLayer"] as any);
  map.addLayer(customLayers["livedLayer"] as any);
  map.addLayer(customLayers["surfedLayer"] as any);
  map.addLayer(customLayers["hostedLayer"] as any);
};

export default addUserRegionsToMap;
