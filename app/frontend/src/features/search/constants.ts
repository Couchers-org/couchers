export const MAP_PAGE = "Map page";

export const selectedUserZoom = 12;

export type MapClickedCallback = (
  ev: mapboxgl.MapMouseEvent & {
    features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
  } & mapboxgl.EventData
) => void;
