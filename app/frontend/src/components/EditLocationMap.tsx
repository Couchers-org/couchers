import { Box, BoxProps, makeStyles, useTheme } from "@material-ui/core";
import classNames from "classnames";
import {
  GeoJSONSource,
  LngLat,
  MapMouseEvent,
  MapTouchEvent,
} from "maplibre-gl";
import React, { useRef, useState } from "react";

import Alert from "./Alert";
import Map from "./Map";
import MapSearch from "./MapSearch";

const useStyles = makeStyles({
  grow: {
    height: "100%",
    width: "100%",
  },
  root: {
    height: 200,
    position: "relative",
    width: 400,
  },
});

export interface Location {
  lat: number;
  lng: number;
}

export interface EditLocationMapProps extends BoxProps {
  // text
  address?: string;
  // lat+lng
  location?: Location;
  setAddress: (value: string) => void;
  //this function is called on mouse release
  setLocation: (value: Location) => void;
  grow?: boolean;
}

export default function EditLocationMap({
  address,
  location,
  setAddress,
  setLocation,
  className,
  grow,
  ...otherProps
}: EditLocationMapProps) {
  const classes = useStyles();
  const theme = useTheme();

  const [error, setError] = useState("");

  const map = useRef<mapboxgl.Map | null>(null);
  //map is imperative so these don't need to cause re-render
  const centerCoords = useRef<LngLat | null>(
    // TODO: better default?
    location
      ? new LngLat(location.lng, location.lat)
      : new LngLat(151.2099, -33.865143)
  );

  const onMouseDown = (e: MapMouseEvent | MapTouchEvent) => {
    // Prevent the default map drag behavior.
    e.preventDefault();

    map.current!.getCanvas().style.cursor = "grab";

    const moveEvent = (e: MapMouseEvent | MapTouchEvent) => onMove(e);
    map.current!.on("mousemove", moveEvent);
    map.current!.once("mouseup", (e) => onUp(e, moveEvent));
  };

  const onMove = (e: MapMouseEvent | MapTouchEvent) => {
    centerCoords.current = e.lngLat;

    (map.current!.getSource("location") as GeoJSONSource).setData(
      pointGeoJson(centerCoords.current!)
    );
  };

  const onUp = (
    e: MapMouseEvent | MapTouchEvent,
    moveEvent: (x: any) => void
  ) => {
    map.current!.off("mousemove", moveEvent);
    map.current!.off("touchmove", moveEvent);
    map.current!.getCanvas().style.cursor = "move";

    onMove(e);
    setLocation({
      lat: centerCoords.current!.lat,
      lng: centerCoords.current!.lng,
    });
  };

  const initializeMap = (mapRef: mapboxgl.Map) => {
    map.current = mapRef;
    map.current!.on("load", () => {
      map.current!.addSource("location", {
        data: pointGeoJson(centerCoords.current!),
        type: "geojson",
      });

      map.current!.addLayer({
        id: "location",
        layout: {},
        paint: {
          "circle-color": theme.palette.primary.main,
          "circle-radius": 10,
        },
        source: "location",
        type: "circle",
      });
    });

    map.current!.on("dblclick", (e) => {
      e.preventDefault();
      onUp(e, () => null);
    });

    map.current!.on("mousedown", "location", onMouseDown);

    map.current!.on("touchstart", "location", (e) => {
      if (e.points.length !== 1) return;
      onMouseDown(e);
    });

    const canvas = map.current!.getCanvas();
    map.current!.on("mouseenter", "location", () => {
      canvas.style.cursor = "move";
    });
    map.current!.on("mouseleave", "location", () => {
      canvas.style.cursor = "";
    });
  };

  const flyToSearch = (location: LngLat) => {
    map.current!.flyTo({ center: location, zoom: 13 });
    onUp(
      {
        lngLat: location,
      } as MapMouseEvent,
      () => null
    );
  };

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <Box
        className={classNames(
          classes.root,
          { [classes.grow]: grow },
          className
        )}
      >
        <Map
          initialZoom={location ? 13 : 2}
          initialCenter={centerCoords.current!}
          postMapInitialize={initializeMap}
          grow
          {...otherProps}
        />
        <MapSearch
          value={address || ""}
          setError={setError}
          setValue={setAddress}
          setMarker={flyToSearch}
        />
      </Box>
    </>
  );
}

function pointGeoJson(
  coords: LngLat
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return {
    features: [
      {
        geometry: {
          coordinates: coords.toArray(),
          type: "Point",
        },
        properties: {},
        type: "Feature",
      },
    ],
    type: "FeatureCollection",
  };
}
