import { MapClickedCallback } from "features/_search/constants";
import { Point } from "geojson";
import {
  GeoJSONSource,
  Map as MaplibreMap,
  MapLayerMouseEvent,
} from "maplibre-gl";

import userPin from "../resources/userPin.png";
import { layers } from "./mapLayers";
import { sources } from "./mapSources";
import { MutableRefObject } from "react";

const addPinImages = async (map: MaplibreMap) => {
  try {
    const image = await map.loadImage(userPin.src);

    if (map.hasImage("user-pin")) return;

    if (image) {
      map.addImage("user-pin", image.data, { sdf: true });
    }
  } catch (error) {
    throw error;
  }
};

const addClusteredUsersToMap = (
  map: MaplibreMap,
  userClickedCallback?: MapClickedCallback,
) => {
  map.addSource("clustered-users", sources["clustered-users"]);
  addPinImages(map);
  map.addLayer(layers.clusterLayer);
  map.addLayer(layers.clusterCountLayer);
  map.addLayer(layers.unclusteredPointLayer);

  if (userClickedCallback) {
    map.on("click", layers.unclusteredPointLayer.id, userClickedCallback);
  }

  map.on("click", layers.clusterLayer.id, zoomCluster);
};

const zoomCluster = async (ev: MapLayerMouseEvent) => {
  const map = ev.target;
  const cluster = ev.features?.[0];
  if (!cluster || !cluster.properties?.cluster_id) return;

  try {
    const source = map.getSource("clustered-users") as GeoJSONSource;
    const zoom = await source.getClusterExpansionZoom(
      cluster.properties.cluster_id,
    );

    if (zoom !== null && zoom !== undefined) {
      const point = cluster.geometry as Point;

      map.flyTo({
        center: point.coordinates as [number, number],
        zoom,
      });
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Deletes all the @map results (by cleaning a map layer), adds a new layer containing a new list of results (@ids) and then sets a callback when user click
 * on one result
 * @param map map to edit its results
 * @param ids new list of results to add
 * @param userClickedCallback callback to be executed when user clicks
 */
const reRenderUsersOnMap = (
  map: MaplibreMap,
  ids: number[] | null,
  userClickedCallback?: MapClickedCallback,
) => {
  //clusters can only be filtered at the source before rendering
  //so we have to remove the layers and sources and re-add
  if (userClickedCallback) {
    map.off("click", layers.unclusteredPointLayer.id, userClickedCallback);
    map.off("click", layers.clusterLayer.id, zoomCluster);
  }

  map.removeLayer(layers.clusterLayer.id);
  map.removeLayer(layers.clusterCountLayer.id);
  map.removeLayer(layers.unclusteredPointLayer.id);
  map.removeSource("clustered-users");

  if (ids) {
    //https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/#in
    //basically it's like `ids.contains(clusteredUser.id)`
    //@ts-ignore - type definition incorrect
    sources["clustered-users"].filter = ["in", ["get", "id"], ["literal", ids]];
  } else {
    //@ts-ignore - type definition incorrect
    delete sources["clustered-users"].filter;
  }

  addClusteredUsersToMap(map, userClickedCallback);
};

const initializeMap = ({
  map,
  newMap,
  onMapSourceLoaded,
  onMapStyleLoaded,
}: {
  map: MutableRefObject<MaplibreMap | undefined>;
  newMap: MaplibreMap;
  onMapSourceLoaded: (isLoaded: boolean) => void;
  onMapStyleLoaded: (isLoaded: boolean) => void;
}) => {
  map.current = newMap;
  newMap.on("load", () => {
    addClusteredUsersToMap(newMap);
  });

  newMap.on("styledata", function () {
    onMapStyleLoaded(true);
  });

  newMap.on("sourcedataloading", function (e) {
    if (e.sourceId === "clustered-users") {
      onMapSourceLoaded(true);
    }
  });
};

export {
  addClusteredUsersToMap,
  initializeMap,
  reRenderUsersOnMap,
  zoomCluster,
};
