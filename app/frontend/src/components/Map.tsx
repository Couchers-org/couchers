import "leaflet/dist/leaflet.css";
import React, { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { LatLng } from "leaflet";
import { Box, BoxProps, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import L from "leaflet";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

//@ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: shadow,
});

const useStyles = makeStyles({
  root: {
    position: "relative",
    height: 200,
    width: 400,
  },
  grow: {
    height: 0,
    width: "100%",
    paddingTop: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
  },
});

export interface MapProps extends BoxProps {
  center: LatLng;
  zoom: number;
  grow?: boolean;
}

export default function Map({
  center,
  zoom,
  grow,
  children,
  className,
  ...otherProps
}: MapProps) {
  const classes = useStyles();

  const tileUrl = process.env.REACT_APP_TILE_URL || "";
  const tileAttribution = process.env.REACT_APP_TILE_ATTRIBUTION;

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
        <MapContainer center={center} zoom={zoom} className={classes.map}>
          <TileLayer url={tileUrl} attribution={tileAttribution} />
          {children}
        </MapContainer>
      </Box>
    </>
  );
}
