import { BoxProps, Slider, Typography, useTheme } from "@material-ui/core";
import classNames from "classnames";
import Map from "components/Map";
import MapSearch from "components/MapSearch";
import TextField from "components/TextField";
import maplibregl, {
  GeoJSONSource,
  LngLat,
  MapMouseEvent,
  MapTouchEvent,
} from "maplibre-gl";
import React, { useRef, useState } from "react";
import makeStyles from "utils/makeStyles";

import { userLocationMaxRadius, userLocationMinRadius } from "../appConstants";
import {
  DISPLAY_LOCATION,
  DISPLAY_LOCATION_NOT_EMPTY,
  getRadiusText,
  INVALID_COORDINATE,
  LOCATION_ACCURACY,
  LOCATION_PUBLICLY_VISIBLE,
  LOCATION_WARN,
  MAP_IS_BLANK,
} from "./constants";

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

export interface EditLocationMapProps extends BoxProps {
  initialLocation?: ApproximateLocation;
  // this function is called on mouse release
  updateLocation: (value: ApproximateLocation | null) => void;
  grow?: boolean;
  // whether to hide the radius slider
  showRadiusSlider?: boolean;
  // whether we are selecting an exact point (for pages, etc) or approx circle, doesn't maeks ense with radius slider
  exact?: boolean;
}

export default function EditLocationMap({
  initialLocation,
  updateLocation,
  className,
  grow,
  showRadiusSlider,
  exact,
  ...otherProps
}: EditLocationMapProps) {
  const classes = useStyles();
  const theme = useTheme();
  const [error, setError] = useState("");

  const map = useRef<maplibregl.Map | null>(null);

  // map is imperative so these don't need to cause re-render
  const location = useRef<ApproximateLocation>({
    address: initialLocation?.address ?? "",
    radius: initialLocation?.radius ?? (exact ? 0 : 250),
    lat: initialLocation?.lat ?? 0,
    lng: initialLocation?.lng ?? 0,
  });
  // have not selected a location in any way yet
  const isBlank = useRef<boolean>(
    !(initialLocation?.lng || initialLocation?.lat)
  );
  const locationDisplayRef = useRef<HTMLInputElement>(null);
  const [shrinkLabel, setShrinkLabel] = useState(
    location.current.address !== ""
  );

  const onCircleMouseDown = (e: MapMouseEvent | MapTouchEvent) => {
    if (!map.current) return;
    // Prevent the default map drag behavior.
    e.preventDefault();

    map.current.getCanvas().style.cursor = "grab";

    if (e.type === "touchstart") {
      const handleTouchMove = (e: MapTouchEvent) => onCircleMove(e);
      map.current.on("touchmove", handleTouchMove);
      map.current.once("touchend", (e) =>
        handleCoordinateMoved(e, handleTouchMove)
      );
    } else {
      const handleMove = (e: MapMouseEvent) => onCircleMove(e);
      map.current.on("mousemove", handleMove);
      map.current.once("mouseup", (e) => handleCoordinateMoved(e, handleMove));
    }
  };

  const onCircleMove = (e: MapMouseEvent | MapTouchEvent) => {
    const wrapped = e.lngLat.wrap();
    commit(
      {
        lat: wrapped.lat,
        lng: wrapped.lng,
      },
      false
    );
    redrawMap();
  };

  const handleCoordinateMoved = (
    e: MapMouseEvent | MapTouchEvent,
    moveHandler: (x: any) => void = () => null
  ) => {
    if (!map.current) return;
    map.current.off("mousemove", moveHandler);
    map.current.off("touchmove", moveHandler);
    map.current.getCanvas().style.cursor = "move";

    const wrapped = e.lngLat.wrap();
    commit({
      lat: wrapped.lat,
      lng: wrapped.lng,
    });
    if (!isBlank.current) {
      map.current.setLayoutProperty("circle", "visibility", "visible");
    }
    redrawMap();
  };

  const redrawMap = () => {
    if (!map.current) return;
    if (!exact) {
      (map.current.getSource("circle") as GeoJSONSource).setData(
        circleGeoJson(extractLngLat(location.current), location.current.radius)
      );
    } else {
      (map.current.getSource("circle") as GeoJSONSource).setData(
        pointGeoJson(extractLngLat(location.current))
      );
    }
  };

  const commit = (
    updates: Partial<ApproximateLocation>,
    shouldUpdate = true
  ) => {
    const addressNotEmpty = !!updates.address;
    if (updates.address !== undefined) {
      setShrinkLabel(addressNotEmpty);
      location.current.address = updates.address;
    }
    if (updates.radius !== undefined && !exact) {
      location.current.radius = updates.radius;
    }
    if (updates.lat !== undefined && updates.lng !== undefined) {
      location.current.lat = updates.lat;
      location.current.lng = updates.lng;
      isBlank.current = false;
    }

    if (shouldUpdate) {
      if (isBlank.current) {
        // haven't selected a location yet
        setError(addressNotEmpty ? MAP_IS_BLANK : "");
        updateLocation(null);
      } else if (location.current.lat === 0 && location.current.lng === 0) {
        // somehow have lat/lng == 0
        setError(INVALID_COORDINATE);
        updateLocation(null);
      } else if (location.current.address === "") {
        // missing display address
        setError(DISPLAY_LOCATION_NOT_EMPTY);
        setShrinkLabel(false);
        updateLocation(null);
      } else {
        setError("");
        setShrinkLabel(true);
        updateLocation({ ...location.current });
      }
    }
  };

  const initializeMap = (mapRef: maplibregl.Map) => {
    map.current = mapRef;
    map.current.once("load", () => {
      if (!map.current) return;
      if (!exact) {
        map.current.addSource("circle", {
          data: circleGeoJson(
            extractLngLat(location.current),
            location.current.radius
          ),
          type: "geojson",
        });

        map.current.addLayer({
          id: "circle",
          layout: {
            visibility: isBlank.current ? "none" : "visible",
          },
          paint: {
            "fill-color": theme.palette.primary.main,
            "fill-opacity": 0.5,
          },
          source: "circle",
          type: "fill",
        });
      } else {
        map.current.addSource("circle", {
          data: pointGeoJson(extractLngLat(location.current)),
          type: "geojson",
        });

        map.current.addLayer({
          id: "circle",
          layout: {
            visibility: isBlank.current ? "none" : "visible",
          },
          paint: {
            "circle-color": theme.palette.primary.main,
            "circle-radius": 8,
            "circle-stroke-color": "#fff",
            "circle-stroke-width": 1,
          },
          source: "circle",
          type: "circle",
        });
      }

      // if no user is specified, ask to get the location from browser
      if (!initialLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          flyToSearch(
            new LngLat(position.coords.longitude, position.coords.latitude)
          );
        });
      }
    });

    const onDblClick = (e: MapMouseEvent & maplibregl.EventData) => {
      e.preventDefault();
      handleCoordinateMoved(e);
    };
    map.current.on("dblclick", onDblClick);

    const onCircleTouch = (
      e: MapTouchEvent & {
        features?: maplibregl.MapboxGeoJSONFeature[] | undefined;
      } & maplibregl.EventData
    ) => {
      if (e.points.length !== 1) return;
      onCircleMouseDown(e);
    };
    map.current.on("mousedown", "circle", onCircleMouseDown);
    map.current.on("touchstart", "circle", onCircleTouch);

    const canvas = map.current.getCanvas();
    const setCursorMove = () => (canvas.style.cursor = "move");
    const unsetCursor = () => (canvas.style.cursor = "");
    map.current.on("mouseenter", "circle", setCursorMove);
    map.current.on("mouseleave", "circle", unsetCursor);
  };

  const flyToSearch = (coords: LngLat) => {
    if (!map.current) return;
    map.current.flyTo({ center: coords, zoom: 12.5 });
    if (!exact) {
      const randomizedLocation = displaceLngLat(
        coords,
        Math.random() * location.current.radius,
        Math.random() * 2 * Math.PI
      );
      handleCoordinateMoved({
        lngLat: randomizedLocation,
      } as MapMouseEvent);
    } else {
      handleCoordinateMoved({
        lngLat: coords,
      } as MapMouseEvent);
    }
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
        <div className={classNames(classes.map)}>
          <Map
            // (10, 35, 0.5) is just a pretty view
            initialZoom={isBlank.current ? 0.5 : 12.5}
            initialCenter={
              isBlank.current
                ? new LngLat(10, 35)
                : extractLngLat(location.current)
            }
            postMapInitialize={initializeMap}
            grow
            {...otherProps}
          />
          <MapSearch
            setError={setError}
            setResult={(coordinate, _, simplified) => {
              commit({ address: simplified }, false);
              if (locationDisplayRef.current) {
                locationDisplayRef.current.value = simplified;
                setShrinkLabel(true);
              }
              flyToSearch(coordinate);
            }}
          />
        </div>
        {showRadiusSlider && (
          <RadiusSlider
            commit={commit}
            initialRadius={location.current.radius}
            redrawMap={redrawMap}
          />
        )}
        <TextField
          defaultValue={location.current.address}
          onChange={(e) => {
            commit({ address: e.target.value });
          }}
          error={error !== ""}
          id="display-address"
          inputRef={locationDisplayRef}
          InputLabelProps={{ shrink: shrinkLabel }}
          fullWidth
          variant="standard"
          label={DISPLAY_LOCATION}
          helperText={error !== "" ? error : LOCATION_PUBLICLY_VISIBLE}
          onFocus={() => setShrinkLabel(true)}
          onBlur={() => !location.current.address && setShrinkLabel(false)}
        />
      </div>
    </>
  );
}

interface RadiusSliderProps {
  commit(updates: Partial<ApproximateLocation>, shouldUpdate?: boolean): void;
  initialRadius: number;
  redrawMap(): void;
}

function RadiusSlider({ commit, initialRadius, redrawMap }: RadiusSliderProps) {
  const [radius, setRadius] = useState(initialRadius);
  return (
    <>
      <Typography variant="body2" gutterBottom>
        {LOCATION_WARN}
      </Typography>
      <Typography id="location-radius" gutterBottom>
        {LOCATION_ACCURACY}
      </Typography>
      <Slider
        aria-labelledby="location-radius"
        aria-valuetext={getRadiusText(radius)}
        value={radius}
        step={5}
        min={userLocationMinRadius}
        max={userLocationMaxRadius}
        onChange={(_, value) => {
          setRadius(value as number);
          commit({ radius: value as number }, false);
          redrawMap();
        }}
        onChangeCommitted={(_, value) => {
          commit({ radius: value as number });
          redrawMap();
        }}
      />
    </>
  );
}

function extractLngLat(loc: ApproximateLocation): LngLat {
  return new LngLat(loc.lng, loc.lat);
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
