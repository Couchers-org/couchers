import { BoxProps, makeStyles, useTheme } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Map from "components/Map";
import MapSearch from "components/MapSearch";
import {
  GeoJSONSource,
  LngLat,
  MapMouseEvent,
  MapTouchEvent,
} from "maplibre-gl";
import { User } from "pb/api_pb";
import React, { useRef, useState } from "react";

import { userLocationMaxRadius, userLocationMinRadius } from "../constants";

const handleRadius = 10;

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

export interface ApproximateLocation {
  lat: number;
  lng: number;
  radius: number;
}

export interface EditUserLocationMapProps extends BoxProps {
  user?: User.AsObject;
  city: string;
  setCity: (value: string) => void;
  //this function is called on mouse release
  setLocation: (value: ApproximateLocation) => void;
  grow?: boolean;
}

export default function EditUserLocationMap({
  user,
  city,
  setCity,
  setLocation,
  className,
  grow,
  ...otherProps
}: EditUserLocationMapProps) {
  const classes = useStyles();
  const theme = useTheme();

  const [error, setError] = useState("");

  const map = useRef<mapboxgl.Map | null>(null);
  //map is imperative so these don't need to cause re-render
  const centerCoords = useRef<LngLat | null>(
    // TODO: better default?
    user ? new LngLat(user.lng, user.lat) : new LngLat(151.2099, -33.865143)
  );
  const radius = useRef<number | null>(user?.radius ?? 200);
  //The handle is draggable to resize the radius.
  //It is offset to avoid overlap with the circle,
  //as this causes both click events to fire.
  //It requires the map.project function to calculate
  //so is set on map load.
  const handleCoords = useRef<LngLat | null>(null);

  const onCircleMouseDown = (e: MapMouseEvent | MapTouchEvent) => {
    // Prevent the default map drag behavior.
    e.preventDefault();

    map.current!.getCanvas().style.cursor = "grab";

    const moveEvent = (e: MapMouseEvent | MapTouchEvent) => onCircleMove(e);
    map.current!.on("mousemove", moveEvent);
    map.current!.once("mouseup", (e) => onCircleUp(e, moveEvent));
  };

  const onCircleMove = (e: MapMouseEvent | MapTouchEvent) => {
    const bearing = calculateBearing(
      centerCoords.current!,
      handleCoords.current!
    );

    centerCoords.current = e.lngLat;

    handleCoords.current = map.current!.unproject(
      offsetPoint(
        map.current!.project(
          displaceLngLat(e.lngLat, radius.current!, bearing)
        ),
        //I have no idea why this is -handleRadius
        -handleRadius,
        bearing
      )
    );

    (map.current!.getSource("circle") as GeoJSONSource).setData(
      circleGeoJson(centerCoords.current!, radius.current!)
    );
    (map.current!.getSource("handle") as GeoJSONSource).setData(
      pointGeoJson(handleCoords.current!)
    );
  };

  const onCircleUp = (
    e: MapMouseEvent | MapTouchEvent,
    moveEvent: (x: any) => void
  ) => {
    map.current!.off("mousemove", moveEvent);
    map.current!.off("touchmove", moveEvent);
    map.current!.getCanvas().style.cursor = "move";

    onCircleMove(e);
    setLocation({
      lat: centerCoords.current!.lat,
      lng: centerCoords.current!.lng,
      radius: radius.current!,
    });
  };

  const onHandleMouseDown = (e: MapMouseEvent | MapTouchEvent) => {
    // Prevent the default map.current! drag behavior.
    e.preventDefault();

    map.current!.getCanvas().style.cursor = "grab";

    const moveEvent = (e: MapMouseEvent) => onHandleMove(e);
    map.current!.on("mousemove", moveEvent);
    map.current!.once("mouseup", (e) => onHandleUp(e, moveEvent));
  };

  const onHandleMove = (e: MapMouseEvent | MapTouchEvent) => {
    const bearing = calculateBearing(centerCoords.current!, e.lngLat);
    radius.current = centerCoords.current!.distanceTo(
      map.current!.unproject(offsetPoint(e.point, handleRadius, bearing))
    );
    radius.current = Math.max(
      Math.min(radius.current, userLocationMaxRadius),
      userLocationMinRadius
    );
    handleCoords.current = e.lngLat;
    (map.current!.getSource("circle") as GeoJSONSource).setData(
      circleGeoJson(centerCoords.current!, radius.current!)
    );
    (map.current!.getSource("handle") as GeoJSONSource).setData(
      pointGeoJson(handleCoords.current!)
    );
  };

  const onHandleUp = (
    e: MapMouseEvent | MapTouchEvent,
    moveEvent: (x: any) => void
  ) => {
    map.current!.off("mousemove", moveEvent);
    map.current!.off("touchmove", moveEvent);
    map.current!.getCanvas().style.cursor = "move";

    onHandleMove(e);
    //onCircleMove will move the handle appropriately in case
    //the user has gone above/below the limit
    onCircleMove({
      ...e,
      //fake the lngLat to pretend it has just moved to it's current position
      lngLat: centerCoords.current!,
    } as MapMouseEvent);
    setLocation({
      lat: centerCoords.current!.lat,
      lng: centerCoords.current!.lng,
      radius: radius.current!,
    });
  };

  const initializeMap = (mapRef: mapboxgl.Map) => {
    map.current = mapRef;
    map.current!.on("load", () => {
      const handlePoint = map.current!.project(
        displaceLngLat(centerCoords.current!, radius.current!, Math.PI / 2)
      );
      handleCoords.current = map.current!.unproject([
        handlePoint.x + handleRadius,
        handlePoint.y,
      ]);

      map.current!.addSource("handle", {
        data: pointGeoJson(handleCoords.current),
        type: "geojson",
      });

      map.current!.addSource("circle", {
        data: circleGeoJson(centerCoords.current!, radius.current!),
        type: "geojson",
      });

      map.current!.addLayer({
        id: "handle",
        paint: {
          "circle-color": theme.palette.primary.main,
          "circle-radius": handleRadius,
        },
        source: "handle",
        type: "circle",
      });

      map.current!.addLayer({
        id: "circle",
        layout: {},
        paint: {
          "fill-color": theme.palette.primary.main,
          "fill-opacity": 0.5,
        },
        source: "circle",
        type: "fill",
      });

      //if no user is specified, ask to get the location from browser
      if (!user) {
        navigator.geolocation.getCurrentPosition((position) => {
          flyToSearch(
            new LngLat(position.coords.longitude, position.coords.latitude)
          );
        });
      }
    });

    map.current!.on("dblclick", (e) => {
      e.preventDefault();
      onCircleUp(e, () => null);
    });

    map.current!.on("mousedown", "handle", onHandleMouseDown);

    map.current!.on("touchstart", "handle", (e) => {
      if (e.points.length !== 1) return;
      onHandleMouseDown(e);
    });

    map.current!.on("mousedown", "circle", onCircleMouseDown);

    map.current!.on("touchstart", "circle", (e) => {
      if (e.points.length !== 1) return;
      onCircleMouseDown(e);
    });

    const canvas = map.current!.getCanvas();
    map.current!.on("mouseenter", "handle", () => {
      canvas.style.cursor = "move";
    });
    map.current!.on("mouseleave", "handle", () => {
      canvas.style.cursor = "";
    });
    map.current!.on("mouseenter", "circle", () => {
      canvas.style.cursor = "move";
    });
    map.current!.on("mouseleave", "circle", () => {
      canvas.style.cursor = "";
    });

    //because of the handle offset, zooming causes the handle to not be at the edge of the radius
    //to solve, trigger a fake "circleMove" with the same coordinates as current
    map.current!.on("zoom", (e) =>
      onCircleMove({
        ...e,
        lngLat: centerCoords.current!,
      } as MapMouseEvent)
    );
  };

  const flyToSearch = (location: LngLat) => {
    map.current!.flyTo({ center: location, zoom: 13 });
    const randomizedLocation = displaceLngLat(
      location,
      Math.random() * radius.current!,
      Math.random() * 2 * Math.PI
    );
    onCircleUp(
      {
        lngLat: randomizedLocation,
      } as MapMouseEvent,
      () => null
    );
  };

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}
      <div
        className={classNames(
          classes.root,
          { [classes.grow]: grow },
          className
        )}
      >
        <Map
          initialZoom={user ? 13 : 2}
          initialCenter={centerCoords.current!}
          postMapInitialize={initializeMap}
          grow
          {...otherProps}
        />
        <MapSearch
          value={city}
          setError={setError}
          setValue={setCity}
          setMarker={flyToSearch}
        />
      </div>
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

function circleGeoJson(
  coords: LngLat,
  radius: number
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return {
    features: [
      {
        geometry: {
          //create a circle of 60 points
          coordinates: [
            [
              ...Array(60)
                .fill(0)
                .map((_, index) => {
                  return displaceLngLat(
                    coords,
                    radius,
                    (index * 2 * Math.PI) / 60
                  ).toArray();
                }),
              displaceLngLat(coords, radius, 0).toArray(),
            ],
          ],
          type: "Polygon",
        },
        properties: {},
        type: "Feature",
      },
    ],
    type: "FeatureCollection",
  };
}

function displaceLngLat(coords: LngLat, distance: number, angle: number) {
  // see https://gis.stackexchange.com/a/2964
  // 111111 m ~ 1 degree
  const lat = coords.lat + (1 / 111111) * distance * Math.cos(angle);
  const lng =
    coords.lng +
    (1 / (111111 * Math.cos((coords.lat / 360) * 2 * Math.PI))) *
      distance *
      Math.sin(angle);
  return new LngLat(lng, lat);
}

function calculateBearing(l1: LngLat, l2: LngLat) {
  const lat1 = (l1.lat / 360) * 2 * Math.PI;
  const lng1 = (l1.lng / 360) * 2 * Math.PI;
  const lat2 = (l2.lat / 360) * 2 * Math.PI;
  const lng2 = (l2.lng / 360) * 2 * Math.PI;
  const lngDiff = lng2 - lng1;
  return Math.atan2(
    Math.sin(lngDiff) * Math.cos(lat2),
    Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDiff)
  );
}

function offsetPoint(
  p: mapboxgl.Point,
  distance: number,
  bearing: number
): [number, number] {
  const offset = [
    //map bearing is 0 = up but xy bearing is 0 = right
    distance * Math.cos(bearing - Math.PI / 2),
    distance * Math.sin(bearing - Math.PI / 2),
  ];
  return [p.x - offset[0], p.y - offset[1]];
}
