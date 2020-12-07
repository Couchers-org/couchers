import React, { RefObject, useState } from "react";
import { Box, BoxProps, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import ReactMapGL, { InteractiveMapProps, ViewportProps } from "react-map-gl";
import { LngLat } from "mapbox-gl";

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
  },
});

export interface MapProps extends BoxProps {
  initialCenter: LngLat;
  initialZoom: number;
  mapRef?: RefObject<ReactMapGL>;
  onUpdate?: (center: LngLat, zoom: number) => void;
  mapProps: Partial<InteractiveMapProps>;
  grow?: boolean;
}

export default function Map({
  initialCenter,
  initialZoom,
  grow,
  onUpdate,
  children,
  className,
  mapRef,
  mapProps,
  ...otherProps
}: MapProps) {
  const classes = useStyles();
  const [viewport, setViewport] = useState({
    latitude: initialCenter.lat,
    longitude: initialCenter.lng,
    zoom: initialZoom,
  });

  const updateViewport = (viewport: ViewportProps) => {
    setViewport({ ...viewport });
    if (onUpdate) {
      onUpdate(
        new LngLat(viewport.longitude, viewport.latitude),
        viewport.zoom
      );
    }
  };

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
        <ReactMapGL
          {...viewport}
          {...mapProps}
          width="100%"
          height="100%"
          onViewportChange={updateViewport}
          className={classes.map}
          mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_KEY || ""}
          ref={mapRef}
        >
          {children}
        </ReactMapGL>
      </Box>
    </>
  );
}
