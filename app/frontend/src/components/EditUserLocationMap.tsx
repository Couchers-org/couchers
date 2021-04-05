import {
  BoxProps,
  makeStyles,
  Slider,
  Typography,
  useTheme,
} from "@material-ui/core";
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

import { userLocationMaxRadius, userLocationMinRadius } from "../constants";

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
  hideRadiusSlider?: boolean;
}

export default function EditUserLocationMap({
  location,
  setLocation,
  className,
  grow,
  hideRadiusSlider,
  ...otherProps
}: EditUserLocationMapProps) {
  const classes = useStyles();
  const theme = useTheme();

  const [error, setError] = useState("");

  const map = useRef<mapboxgl.Map | null>(null);

  // reactive location
  const [rLocation, setRLocation] = useState<ApproximateLocation>(
    location ?? {
      address: "",
      lat: 0,
      lng: 0,
      radius: 250,
    }
  );

  // map is imperative so these don't need to cause re-render
  const centerCoords = useRef<LngLat | null>(
    location ? new LngLat(rLocation.lng, rLocation.lat) : new LngLat(35, 10)
  );
  const radius = useRef<number>(rLocation.radius);

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
    redrawMap();
  };

  const onCircleUp = (
    e: MapMouseEvent | MapTouchEvent,
    moveHandler: (x: any) => void
  ) => {
    map.current!.off("mousemove", moveHandler);
    map.current!.off("touchmove", moveHandler);
    map.current!.getCanvas().style.cursor = "move";

    centerCoords.current = e.lngLat;
    redrawMap();
    syncCoords();
  };

  const redrawMap = () => {
    (map.current!.getSource("circle") as GeoJSONSource).setData(
      circleGeoJson(centerCoords.current!, radius.current)
    );
  };

  // syncs imperative coordinates into the reactive location object
  const syncCoords = () => {
    const wrapped = centerCoords.current!.wrap();
    commit((rLocation) => {
      return {
        ...rLocation,
        lat: wrapped.lat,
        lng: wrapped.lng,
      };
    });
  };

  const commit = async (
    update: (s: ApproximateLocation) => ApproximateLocation
  ) => {
    await setRLocation(update);
    setLocation(rLocation);
  };

  const initializeMap = (mapRef: mapboxgl.Map) => {
    map.current = mapRef;
    map.current!.once("load", () => {
      map.current!.addSource("circle", {
        data: circleGeoJson(centerCoords.current!, radius.current),
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
      if (!location && navigator.geolocation) {
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
      Math.random() * radius.current,
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
      <div
        className={classNames(
          classes.root,
          { [classes.grow]: grow },
          className
        )}
      >
        {error && <Alert severity="error">{error}</Alert>}
        <div className={classNames(classes.map)}>
          <Map
            initialZoom={location ? 13 : 0.5}
            initialCenter={centerCoords.current!}
            postMapInitialize={initializeMap}
            grow
            {...otherProps}
          />
          <MapSearch
            setError={setError}
            setAddress={(_, simplified) =>
              commit((rLocation) => {
                return { ...rLocation, address: simplified };
              })
            }
            setMarker={flyToSearch}
          />
        </div>
        <div className={classes.coordinateBox}>
          ({rLocation.lat.toFixed(5)}, {rLocation.lng.toFixed(5)})
        </div>
        {!hideRadiusSlider && (
          <>
            <Typography id="location-radius" gutterBottom>
              Location accuracy
            </Typography>
            <Slider
              aria-labelledby="location-radius"
              value={rLocation.radius}
              min={userLocationMinRadius}
              max={userLocationMaxRadius}
              onChange={(_, value) => {
                radius.current = value as number;
                redrawMap();
                commit((rLocation) => {
                  return { ...rLocation, radius: value as number };
                });
              }}
            />
          </>
        )}
        <TextField
          value={rLocation.address}
          onChange={(e) =>
            commit((rLocation) => {
              return { ...rLocation, address: e.target.value };
            })
          }
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
