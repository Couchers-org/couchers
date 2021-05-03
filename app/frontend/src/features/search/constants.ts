import { UserSearchFilters } from "service/search";

export const MAP_PAGE = "Map page";
export const NO_USER_RESULTS = "No users found.";
export const USER_SEARCH = "Search for a user...";
export const SEARCH_PROFILES = "Press again to search by name or profile";

export const selectedUserZoom = 12;

export type MapClickedCallback = (
  ev: mapboxgl.MapMouseEvent & {
    features?: mapboxgl.MapboxGeoJSONFeature[] | undefined;
  } & mapboxgl.EventData
) => void;

export interface SearchParams extends UserSearchFilters {
  location?: string;
}
