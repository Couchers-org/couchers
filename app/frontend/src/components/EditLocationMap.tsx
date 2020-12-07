import { BoxProps, makeStyles } from "@material-ui/core";
import { LngLat } from "mapbox-gl";
import ReactMapGL, { DraggableControlProps } from "react-map-gl";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DragEvent, Marker } from "react-map-gl";
import {
  userLocationDefault,
  userLocationDefaultRadius,
  userLocationMaxRadius,
  userLocationMinRadius,
} from "../constants";
import { User } from "../pb/api_pb";
import { SetLocationReq } from "../pb/jail_pb";
import Map from "./Map";

const useStyles = makeStyles({
  root: {},
});

export interface EditLocationMapProps extends BoxProps {
  user?: User.AsObject;
  setLocation: (location: SetLocationReq.AsObject) => void;
}

export default function EditLocationMap({
  user,
  setLocation,
  ...otherProps
}: EditLocationMapProps) {
  const classes = useStyles();

  const center = useMemo(
    () => (user ? new LngLat(user.lng, user.lat) : userLocationDefault),
    [user]
  );

  const [city, setCity] = useState("city");
  const [markerPos, setMarkerPos] = useState(center);
  const [markerRadius, setMarkerRadius] = useState(0);
  const [radius, setRadius] = useState(
    user?.radius || userLocationDefaultRadius
  );
  const mapRef = useRef<ReactMapGL>(null);

  const markerDrag = (event: DragEvent) => {
    const pos = LngLat.convert(event.lngLat);
    setMarkerPos(pos);
  };
  const markerDragEnd = (event: DragEvent) => {
    markerDrag(event);
    setLocation({ city, lat: markerPos.lat, lng: markerPos.lng, radius });
  };

  const updateRadius = useCallback(
    (value: number) => {
      setRadius(value);
      setLocation({
        city,
        lat: markerPos.lat,
        lng: markerPos.lng,
        radius: value,
      });
    },
    [city, markerPos, setLocation]
  );

  useEffect(() => {
    const circleCenter = mapRef.current?.getMap().project(markerPos);
    const circleEdge = markerPos.toBounds(radius);
    const circleEdgePoint = mapRef.current
      ?.getMap()
      .project([circleEdge.getEast(), markerPos.lat]);
    setMarkerRadius(
      circleEdgePoint && circleCenter
        ? Math.abs(circleEdgePoint.x - circleCenter.x)
        : 0
    );
  }, [mapRef, markerPos, radius]);

  return (
    <>
      <Map
        initialCenter={center}
        initialZoom={13}
        mapRef={mapRef}
        {...otherProps}
      >
        <Marker
          draggable
          latitude={markerPos.lat}
          longitude={markerPos.lng}
          offsetLeft={-markerRadius}
          offsetTop={-markerRadius}
          onDrag={markerDrag}
          onDragEnd={markerDragEnd}
        >
          <svg
            height={markerRadius * 2}
            viewBox={`0 0 ${markerRadius * 2} ${markerRadius * 2}`}
            fillOpacity="0.2"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx={markerRadius} cy={markerRadius} r={markerRadius} />
          </svg>
        </Marker>
        <AdjustableCircleHandle
          position={markerPos}
          size={10}
          radius={radius}
          setRadius={updateRadius}
        />
      </Map>
    </>
  );
}

interface AdjustableCircleHandleProps extends DraggableControlProps {
  position: LngLat;
  size: number;
  radius: number;
  setRadius: (radius: number) => void;
}

function AdjustableCircleHandle({
  position,
  size,
  radius,
  setRadius,
}: AdjustableCircleHandleProps) {
  const [lngLat, setLngLat] = useState([
    position.toBounds(radius).getEast(),
    position.lat,
  ]);

  const onDrag = (event: DragEvent) => {
    setLngLat(event.lngLat);
    setRadius(position.distanceTo(LngLat.convert(event.lngLat)));
  };

  useEffect(() => {
    setLngLat([position.toBounds(radius).getEast(), position.lat]);
  }, [position]);

  return (
    <>
      <Marker
        draggable
        longitude={lngLat[0]}
        latitude={lngLat[1]}
        offsetLeft={-size / 2}
        offsetTop={-size / 2}
        onDrag={onDrag}
      >
        <svg
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx={size / 2} cy={size / 2} r={size / 2} />
        </svg>
      </Marker>
    </>
  );
}
