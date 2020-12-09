import { BoxProps, makeStyles } from "@material-ui/core";
import { LngLat } from "mapbox-gl";
import ReactMapGL, { PointerEvent } from "react-map-gl";
import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { DragEvent, Marker } from "react-map-gl";
import {
  userLocationDefault,
  userLocationDefaultRadius,
  userLocationMaxRadius,
  userLocationMinRadius,
} from "../constants";
import Map from "./Map";

const useStyles = makeStyles((theme) => ({
  circle: {
    fillOpacity: 0.3,
    fill: theme.palette.primary.main,
    strokeWidth: 1,
    stroke: "white",
  },
  handle: {
    fill: theme.palette.primary.main,
    strokeWidth: 2,
    stroke: "white",
  },
}));

export interface ApproximateLocation {
  location: LngLat;
  //meters
  radius: number;
}

export interface ApproximateLocationMapProps extends BoxProps {
  initialLocation?: ApproximateLocation;
  initialZoom?: number;
  handleSize: number;
  //this function is called on mouse release
  setLocation: (location: ApproximateLocation) => void;
  //I would prefer this not to be a required prop but I'm not
  //sure how to do that and have the ref in the parent too
  mapRef: RefObject<ReactMapGL>;
}

export default function ApproximateLocationMap({
  initialLocation,
  initialZoom = 13,
  handleSize,
  setLocation,
  children,
  mapRef,
  ...otherProps
}: ApproximateLocationMapProps) {
  const classes = useStyles();

  const initialCenter = useMemo(
    () => (initialLocation ? initialLocation.location : userLocationDefault),
    [initialLocation]
  );

  const [circlePos, setCirclePos] = useState(initialCenter);
  const [radius, setRadius] = useState(
    initialLocation?.radius || userLocationDefaultRadius
  );
  //The radius must be state, because calculating it requires the mapRef to
  //be set (it is null until the map loads) for the projection functions.
  //If it is state, it can be updated when mapRef changes using useEffect.
  const [screenRadius, setScreenRadius] = useState(0);

  //We need the calculate the angle to preserve the handle's position when
  //dragging the circle. However it should not  trigger re-renders so we
  //use a ref.
  const angle = useRef<number | null>(0);

  const circleDrag = (event: DragEvent) => {
    const pos = LngLat.convert(event.lngLat);
    setCirclePos(pos);
  };

  const circleDragEnd = (event: DragEvent) => {
    circleDrag(event);
    setLocation({ location: circlePos, radius });
  };

  const onHandleDrag = (event: DragEvent) => {
    //calculate the angle
    const positionXY = mapRef.current!.getMap().project(circlePos);
    const xy = mapRef.current!.getMap().project(event.lngLat);
    angle.current = Math.atan2(xy.y - positionXY.y, xy.x - positionXY.x);
    setRadius(circlePos.distanceTo(LngLat.convert(event.lngLat)));
  };

  const onHandleDragEnd = (event: DragEvent) => {
    onHandleDrag(event);
    //clamp the radius to the max/min
    const r = Math.min(
      Math.max(radius, userLocationMinRadius),
      userLocationMaxRadius
    );
    setRadius(r);
    setLocation({
      location: circlePos,
      radius: r,
    });
  };

  const onDoubleClick = (event: PointerEvent) => {
    const pos = LngLat.convert(event.lngLat);
    setCirclePos(pos);
    setLocation({ location: circlePos, radius });
  };

  const updateScreenRadius = () => {
    const circlePosXY = mapRef.current?.getMap().project(circlePos);
    const circleEdge = circlePos.toBounds(radius);
    const circleEdgePoint = mapRef.current
      ?.getMap()
      .project([circleEdge.getEast(), circlePos.lat]);
    setScreenRadius(
      circleEdgePoint && circlePosXY
        ? Math.abs(circleEdgePoint.x - circlePosXY.x)
        : 0
    );
  };

  useEffect(updateScreenRadius, [mapRef, circlePos, radius]);

  if (mapRef.current?.getMap().isMoving()) updateScreenRadius();

  //below code turns the angle and radius into a LngLat for the <Marker>
  let handleLngLat: LngLat;
  const circlePosXY = mapRef.current?.getMap().project(circlePos);
  if (!mapRef.current || !circlePosXY) {
    handleLngLat = circlePos;
  } else {
    const point: [number, number] = [
      screenRadius * Math.cos(angle.current!) + circlePosXY.x,
      screenRadius * Math.sin(angle.current!) + circlePosXY.y,
    ];
    handleLngLat = mapRef.current.getMap().unproject(point);
  }

  return (
    <>
      <Map
        initialCenter={initialCenter}
        initialZoom={initialZoom}
        mapRef={mapRef}
        //without this line, zooming doesn't update the circle marker
        onUpdate={updateScreenRadius}
        mapProps={{ onDblClick: onDoubleClick }}
        {...otherProps}
      >
        <Marker
          draggable
          latitude={circlePos.lat}
          longitude={circlePos.lng}
          offsetLeft={-screenRadius}
          offsetTop={-screenRadius}
          onDrag={circleDrag}
          onDragEnd={circleDragEnd}
        >
          <svg
            height={screenRadius * 2}
            viewBox={`0 0 ${screenRadius * 2} ${screenRadius * 2}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx={screenRadius}
              cy={screenRadius}
              r={screenRadius}
              className={classes.circle}
            />
          </svg>
        </Marker>
        <Marker
          draggable
          longitude={handleLngLat.lng}
          latitude={handleLngLat.lat}
          offsetLeft={-handleSize / 2}
          offsetTop={-handleSize / 2}
          onDrag={onHandleDrag}
          onDragEnd={onHandleDragEnd}
        >
          <svg
            height={handleSize}
            viewBox={`0 0 ${handleSize} ${handleSize}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx={handleSize / 2}
              cy={handleSize / 2}
              r={handleSize / 2}
              className={classes.handle}
            />
          </svg>
        </Marker>
        {children}
      </Map>
    </>
  );
}
