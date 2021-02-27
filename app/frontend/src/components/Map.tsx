import "maplibre-gl/dist/mapbox-gl.css";

import { Box, BoxProps, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import mapboxgl, { LngLat, RequestParameters } from "maplibre-gl";
import React, { useEffect, useRef } from "react";

const URL = process.env.REACT_APP_API_BASE_URL;

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY!;

const useStyles = makeStyles({
  root: {
    position: "relative",
    height: 200,
    width: 400,
  },
  grow: {
    width: "100%",
    height: "100%",
  },
  map: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
});

export interface MapProps extends BoxProps {
  initialCenter: LngLat;
  initialZoom: number;
  postMapInitialize?: (map: mapboxgl.Map) => void;
  onUpdate?: (center: LngLat, zoom: number) => void;
  grow?: boolean;
  interactive?: boolean;
}

export default function Map({
  initialCenter,
  initialZoom,
  grow,
  postMapInitialize,
  onUpdate,
  interactive = true,
  className,
  ...otherProps
}: MapProps) {
  const classes = useStyles();

  const containerRef = useRef<HTMLDivElement>(null);

  /*
  Allows sending cookies (counted as sensitive "credentials") on cross-origin requests when we grab GeoJSON/other data from the API.

  Those APIs will return an error if the session cookie is not set as these APIs are secure and not public.
  */
  const transformRequest = (url: string): RequestParameters => {
    if (url.startsWith(URL)) {
      return {
        url,
        credentials: "include",
      };
    }
    return { url };
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: initialCenter,
      zoom: initialZoom,
      hash: "loc",
      interactive: interactive,
      transformRequest,
    });

    if (interactive)
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    if (onUpdate) {
      map.on("moveend", () => onUpdate(map.getCenter(), map.getZoom()));
    }

    if (postMapInitialize) postMapInitialize(map);
  }, []); // eslint-disable-line

  return (
    <>
      <Box
        className={classNames(
          classes.root,
          { [classes.grow]: grow },
          className
        )}
        {...otherProps}
      >
        <div className={classes.map} ref={containerRef} />
      </Box>
    </>
  );
}
