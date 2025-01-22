import "maplibre-gl/dist/maplibre-gl.css";

import { styled, Typography } from "@mui/material";
import { NO_MAP_SUPPORT } from "components/constants";
import {
  LngLat,
  Map as MaplibreMap,
  NavigationControl,
  RequestParameters,
} from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

const URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const StyledWrapper = styled("div")<{ grow?: boolean }>(({ grow }) => ({
  position: "relative",
  height: grow ? "100%" : "200px",
  width: grow ? "100%" : "400px",
}));

const StyledMap = styled("div")({
  position: "absolute",
  bottom: 0,
  top: 0,
  width: "100%",
  height: "100%", // Add this to ensure the child takes the parent's height
});

const StyledNoMapText = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
});

export interface MapProps {
  initialCenter: LngLat | undefined;
  initialZoom: number;
  postMapInitialize?: (map: MaplibreMap) => void;
  className?: string;
  onUpdate?: (center: LngLat, zoom: number) => void;
  grow?: boolean;
  interactive?: boolean;
  hash?: boolean;
}

export default function Map({
  initialCenter,
  initialZoom,
  grow,
  postMapInitialize,
  onUpdate,
  hash,
  interactive = true,
  className,
  ...otherProps
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [noMap, setNoMap] = useState(false);

  /*
  Allows sending cookies (counted as sensitive "credentials") on cross-origin requests when we grab GeoJSON/other data from the API.
  Those APIs will return an error if the session cookie is not set as these APIs are secure and not public.
  */
  const transformRequest = (url: string): RequestParameters => {
    if (url.startsWith(URL)) {
      return {
        credentials: "include",
        url,
      };
    }
    return { url };
  };

  const mapRef = useRef<MaplibreMap>();

  useEffect(() => {
    if (!containerRef.current) return;

    // don't create a new map if it exists already
    if (mapRef.current) return;

    try {
      const map = new MaplibreMap({
        center: initialCenter,
        container: containerRef.current,
        hash: hash ? "loc" : false,
        interactive: interactive,
        style: "https://cdn.couchers.org/maps/couchers-basemap-style-v1.json",
        transformRequest,
        zoom: initialZoom,
      });

      mapRef.current = map;

      if (interactive) {
        map.addControl(new NavigationControl({ showCompass: false }));
      }

      if (onUpdate) {
        map.on("moveend", () => onUpdate(map.getCenter(), map.getZoom()));
      }

      postMapInitialize?.(map);
    } catch {
      //probably no webgl
      console.warn("Couldn't initialize maplibre gl");
      setNoMap(true);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = undefined;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StyledWrapper className={className} grow={grow} {...otherProps}>
      <StyledMap ref={containerRef}>
        {noMap && (
          <StyledNoMapText>
            <Typography variant="body1">{NO_MAP_SUPPORT}</Typography>
          </StyledNoMapText>
        )}
      </StyledMap>
    </StyledWrapper>
  );
}
