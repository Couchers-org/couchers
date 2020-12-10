import React, { useEffect, useRef } from "react";
import { Box, BoxProps, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl, { LngLat } from "mapbox-gl";

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
}

export default function Map({
  initialCenter,
  initialZoom,
  grow,
  postMapInitialize,
  onUpdate,
  className,
  ...otherProps
}: MapProps) {
  const classes = useStyles();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: initialCenter,
      zoom: initialZoom,
    });

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
