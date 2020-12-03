import { Box, BoxProps, makeStyles } from "@material-ui/core";
import { LatLng } from "leaflet";
import React, { useMemo, useRef, useState } from "react";
import { Circle, Marker, useMapEvents } from "react-leaflet";
import { userLocationMaxRadius, userLocationMinRadius } from "../constants";
import { User } from "../pb/api_pb";
import Map from "./Map";

const useStyles = makeStyles({
  root: {},
});

export interface UserLocation {
  lat: number;
  lng: number;
  //meters
  radius: number;
}

export interface EditLocationMapProps extends BoxProps {
  user: User.AsObject;
  setLocation: (location: UserLocation) => void;
}

export default function EditLocationMap({
  user,
  setLocation,
  ...otherProps
}: EditLocationMapProps) {
  const classes = useStyles();

  const center = useMemo(() => new LatLng(user.lat, user.lng), [user]);
  //What type is this useRef supposed to be!? Marker doesn't want to work
  const markerRef = useRef<any>(null);

  const [markerPos, setMarkerPos] = useState(new LatLng(user.lat, user.lng));
  const [radius, setRadius] = useState(user.radius);

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const pos = marker.getLatLng();
          setMarkerPos(pos);
          setLocation({ lat: pos.lat, lng: pos.lng, radius: radius });
        }
      },
    }),
    [radius, setLocation]
  );

  const updateRadius = (value: number) => {
    setRadius(value);
    const marker = markerRef.current;
    if (marker != null) {
      const pos = marker.getLatLng();
      setMarkerPos(pos);
      setLocation({ lat: pos.lat, lng: pos.lng, radius: value });
    }
  };

  return (
    <>
      <Box {...otherProps}>
        <Map center={center} zoom={13}>
          <Marker
            position={markerPos}
            draggable
            eventHandlers={markerEventHandlers}
            ref={markerRef}
          />
          <AdjustableCircle
            position={markerPos}
            radius={radius}
            setRadius={updateRadius}
          />
        </Map>
      </Box>
    </>
  );
}

interface AdjustableCircleProps {
  position: LatLng;
  radius: number;
  setRadius: (radius: number) => void;
}

function AdjustableCircle({
  position,
  radius,
  setRadius,
}: AdjustableCircleProps) {
  const [clicked, setClicked] = useState(false);
  const [dirtyRadius, setDirtyRadius] = useState(radius);

  const map = useMapEvents({
    mousemove(event) {
      if (clicked) {
        const r = event.latlng.distanceTo(position);
        const clampedR = Math.min(
          Math.max(r, userLocationMinRadius),
          userLocationMaxRadius
        );
        setDirtyRadius(clampedR);
      }
    },
    mouseup() {
      if (!clicked) return;
      map.dragging.enable();
      setRadius(dirtyRadius);
      setClicked(false);
    },
  });

  const eventHandlers = {
    mousedown() {
      map.dragging.disable();
      setClicked(true);
    },
  };

  return (
    <>
      <Circle
        center={position}
        radius={dirtyRadius}
        eventHandlers={eventHandlers}
      />
    </>
  );
}
