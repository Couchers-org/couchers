import "maplibre-gl/dist/maplibre-gl.css";

import {
  CLUSTER_LAYER_ID,
  clusterCountLayer,
  clusterLayer,
  unclusteredPointLayer,
} from "features/search/utils/mapLayers";
import { Point } from "geojson";
import {
  GeoJSONSource,
  LngLat,
  MapLayerMouseEvent,
  RequestParameters,
} from "maplibre-gl";
import React from "react";
import {
  Layer,
  Map as MaplibreMap,
  NavigationControl,
  Source,
  useMap,
} from "react-map-gl/maplibre";

const URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface MapProps {
  grow?: boolean;
  hash?: boolean;
  initialCenter: LngLat | undefined;
  initialZoom: number;
  onClick: (ev: MapLayerMouseEvent) => void;
  onLoad: () => void;
}

const Map = ({
  grow,
  hash,
  initialCenter,
  initialZoom,
  onClick,
  onLoad,
}: MapProps) => {
  const { map } = useMap();

  const transformRequest = (url: string): RequestParameters => {
    if (url.startsWith(URL)) {
      return {
        credentials: "include",
        url,
      };
    }
    return { url };
  };

  const handleMapLoad = () => {
    onLoad();
  };

  const handleMapClick = async (ev: MapLayerMouseEvent) => {
    const feature = ev.features?.[0];

    if (!feature) return;

    const clusterId = feature?.properties.cluster_id;

    if (clusterId === CLUSTER_LAYER_ID) {
      const source = map?.getSource("clustered-users") as GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(
        feature.properties.cluster_id,
      );

      if (zoom !== null && zoom !== undefined) {
        const point = feature.geometry as Point;

        map?.flyTo({
          center: point.coordinates as [number, number],
          zoom,
        });
      }
    }

    onClick(ev);
  };

  return (
    <>
      <MaplibreMap
        id="map"
        initialViewState={{
          longitude: initialCenter?.lng ?? 0,
          latitude: initialCenter?.lat ?? 0,
          zoom: initialZoom,
        }}
        style={{
          height: grow ? "100%" : "200px",
          width: grow ? "100%" : "400px",
        }}
        interactive={true}
        transformRequest={transformRequest}
        mapStyle="https://cdn.couchers.org/maps/couchers-basemap-style-v1.json"
        interactiveLayerIds={clusterLayer.id ? [clusterLayer.id] : []}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        hash={hash}
      >
        <Source
          id="clustered-users"
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
          data={URL + "/geojson/users"}
          promoteId={"id"}
          type={"geojson"}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
        </Source>
        <NavigationControl position="top-right" showCompass={false} />
      </MaplibreMap>
    </>
  );
};

export default Map;
