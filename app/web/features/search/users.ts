import { MapClickedCallback } from "features/search/constants";
import { Point } from "geojson";
import {
  GeoJSONSource,
  LayerSpecification,
  Map as MaplibreMap,
  MapLayerMouseEvent,
  SourceSpecification,
} from "maplibre-gl";
import { User } from "proto/api_pb";
import { UserSearchRes } from "proto/search_pb";
import { InfiniteData } from "react-query";
import { theme } from "theme";

import userPin from "./resources/userPin.png";

const URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type SourceKeys = "clustered-users";
export const sources: Record<SourceKeys, SourceSpecification> = {
  "clustered-users": {
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    data: URL + "/geojson/users",
    promoteId: "id",
    type: "geojson",
  },
};

type LayerKeys = "clusterCountLayer" | "clusterLayer" | "unclusteredPointLayer";
export const layers: Record<LayerKeys, LayerSpecification> = {
  clusterCountLayer: {
    filter: ["has", "point_count"],
    id: "clusters-count",
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
      "text-font": ["Inter 28pt SemiBold"],
    },
    paint: {
      "text-color": [
        "step",
        ["get", "point_count"],
        theme.palette.getContrastText(theme.palette.primary.light),
        100,
        theme.palette.getContrastText(theme.palette.primary.main),
        750,
        theme.palette.getContrastText(theme.palette.primary.dark),
      ],
    },
    source: "clustered-users",
    type: "symbol",
  },
  clusterLayer: {
    filter: ["has", "point_count"],
    id: "clusters",
    paint: {
      // step expression: https://docs.mapbox.com/mapbox-gl-js/style-spec/expressions/#step
      "circle-color": [
        "step",
        ["get", "point_count"],
        theme.palette.primary.light,
        100,
        theme.palette.primary.main,
        750,
        theme.palette.primary.dark,
      ],
      "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    },
    source: "clustered-users",
    type: "circle",
  },
  unclusteredPointLayer: {
    filter: ["!", ["has", "point_count"]],
    id: "unclustered-points",
    layout: {
      "icon-image": "user-pin",
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
    },
    paint: {
      "icon-color": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        theme.palette.secondary.main,
        ["==", ["get", "has_completed_profile"], true],
        theme.palette.primary.main,
        theme.palette.grey[500],
      ],
      "icon-halo-width": 2,
      "icon-halo-color": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        theme.palette.secondary.main,
        ["==", ["get", "has_completed_profile"], true],
        theme.palette.primary.main,
        theme.palette.grey[500],
      ],
      "icon-halo-blur": 2,
    },
    source: "clustered-users",
    type: "symbol",
  },
};

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

const zoomCluster = async (ev: MapLayerMouseEvent) => {
  const map = ev.target;
  const cluster = ev.features?.[0];
  if (!cluster || !cluster.properties?.cluster_id) return;

  try {
    const source = map.getSource("clustered-users") as GeoJSONSource;
    const zoom = await source.getClusterExpansionZoom(
      cluster.properties.cluster_id
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
 * Filters the data and format it
 */
export const filterData = (data: InfiniteData<UserSearchRes.AsObject>) => {
  return data.pages
    .flatMap((page) => page.resultsList)
    .map((result) => {
      return result.user;
    })
    .filter((user): user is User.AsObject => !!user)
    .map((user) => user.userId);
};

export const addClusteredUsersToMap = (
  map: MaplibreMap,
  userClickedCallback?: MapClickedCallback
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

/**
 * Deletes all the @map results (by cleaning a map layer), adds a new layer containing a new list of results (@ids) and then sets a callback when user click
 * on one result
 * @param map map to edit its results
 * @param ids new list of results to add
 * @param userClickedCallback callback to be executed when user clicks
 */
export const reRenderUsersOnMap = (
  map: MaplibreMap,
  ids: number[] | null,
  userClickedCallback?: MapClickedCallback
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
