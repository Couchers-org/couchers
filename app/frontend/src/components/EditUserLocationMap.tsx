import { BoxProps, makeStyles, useTheme } from "@material-ui/core";
import classNames from "classnames";
import Alert from "components/Alert";
import Map from "components/Map";
import MapSearch from "components/MapSearch";
import TextField from "components/TextField";
import {
  GeoJSONSource,
  LngLat,
  MapMouseEvent,
  MapTouchEvent,
} from "maplibre-gl";
import React, { useRef, useState } from "react";

const useStyles = makeStyles({
  root: {
    margin: "auto",
    maxWidth: 700,
  },
  map: {
    height: 400,
    position: "relative",
  },
  grow: {
    height: "100%",
    width: "100%",
  },
  coordinateBox: {
    textAlign: "right",
  },
  displayLocation: {
    width: "100%",
  },
});

export interface ApproximateLocation {
  address: string;
  lat: number;
  lng: number;
  radius: number;
}

export interface EditUserLocationMapProps extends BoxProps {
  location?: ApproximateLocation;
  // this function is called on mouse release
  setLocation: (value: ApproximateLocation) => void;
  grow?: boolean;
}

export default function EditUserLocationMap({
  location,
  setLocation,
  className,
  grow,
  ...otherProps
}: EditUserLocationMapProps) {
  const classes = useStyles();
  const theme = useTheme();

  const [error, setError] = useState("");

  const map = useRef<mapboxgl.Map | null>(null);

  const [displayAddress, setDisplayAddress] = useState<string>(location?.address ?? "")

  // map is imperative so these don't need to cause re-render
  const centerCoords = useRef<LngLat | null>(
    // TODO: better default?
    location ? new LngLat(location.lng, location.lat) : new LngLat(151.2099, -33.865143)
  );
  const radius = useRef<number | null>(location?.radius ?? 250);

  const onCircleMouseDown = (e: MapMouseEvent | MapTouchEvent) => {
    // Prevent the default map drag behavior.
    e.preventDefault();

    map.current!.getCanvas().style.cursor = "grab";

    if (e.type === "touchstart") {
      const handleTouchMove = (e: MapTouchEvent) => onCircleMove(e);
      map.current!.on("touchmove", handleTouchMove);
      map.current!.once("touchend", (e) => onCircleUp(e, handleTouchMove));
    } else {
      const handleMove = (e: MapMouseEvent) => onCircleMove(e);
      map.current!.on("mousemove", handleMove);
      map.current!.once("mouseup", (e) => onCircleUp(e, handleMove));
    }
  };

  const onCircleMove = (e: MapMouseEvent | MapTouchEvent) => {
    centerCoords.current = e.lngLat;

    (map.current!.getSource("circle") as GeoJSONSource).setData(
      circleGeoJson(centerCoords.current!, radius.current!)
    );
  };

  const onCircleUp = (
    e: MapMouseEvent | MapTouchEvent,
    moveHandler: (x: any) => void
  ) => {
    map.current!.off("mousemove", moveHandler);
    map.current!.off("touchmove", moveHandler);
    map.current!.getCanvas().style.cursor = "move";

    onCircleMove(e);
    bubble()
  };

  const initializeMap = (mapRef: mapboxgl.Map) => {
    map.current = mapRef;
    map.current!.once("load", () => {
      map.current!.addSource("circle", {
        data: circleGeoJson(centerCoords.current!, radius.current!),
        type: "geojson",
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

      // if no user is specified, ask to get the location from browser
      if (!location) {
        navigator.geolocation.getCurrentPosition((position) => {
          flyToSearch(
            new LngLat(position.coords.longitude, position.coords.latitude)
          );
        });
      }
    });

    const onDblClick = (e: MapMouseEvent & mapboxgl.EventData) => {
      e.preventDefault();
      onCircleUp(e, () => null);
    };
    map.current!.on("dblclick", onDblClick);

    const onCircleTouch = (
      e: MapTouchEvent & {
        features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
      } & mapboxgl.EventData
    ) => {
      if (e.points.length !== 1) return;
      onCircleMouseDown(e);
    };
    map.current!.on("mousedown", "circle", onCircleMouseDown);
    map.current!.on("touchstart", "circle", onCircleTouch);

    const canvas = map.current!.getCanvas();
    const setCursorMove = () => (canvas.style.cursor = "move");
    const unsetCursor = () => (canvas.style.cursor = "");
    map.current!.on("mouseenter", "circle", setCursorMove);
    map.current!.on("mouseleave", "circle", unsetCursor);
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

  const bubble = () => {
    const wrapped = centerCoords.current!.wrap();
    setLocation({
      address: displayAddress,
      lat: wrapped.lat,
      lng: wrapped.lng,
      radius: radius.current!,
    });
  }

  return (
    <>
      <div className={classes.root}>
        {error && <Alert severity="error">{error}</Alert>}
        <div
          className={classNames(
            classes.map,
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
            setError={setError}
            setAddress={(_, simplified) => setDisplayAddress(simplified)}
            setMarker={flyToSearch}
          />
        </div>
        <div className={classes.coordinateBox}>
          ({centerCoords.current!.lat.toFixed(5)}, {centerCoords.current!.lng.toFixed(5)})
        </div>
        <TextField
          value={displayAddress}
          onChange={e => setDisplayAddress(e.target.value)}
          id="display-address"
          fullWidth
          variant="standard"
          label="Display location"
          helperText="This will be displayed on your profile"
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
  let lat = coords.lat + (1 / 111111) * distance * Math.cos(angle);
  let lng =
    coords.lng +
    (1 / (111111 * Math.cos((coords.lat / 360) * 2 * Math.PI))) *
      distance *
      Math.sin(angle);

  return new LngLat(lng, lat);
}
