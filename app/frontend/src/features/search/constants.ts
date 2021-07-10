import maplibregl from "maplibre-gl";
import { UserSearchFilters } from "service/search";

export const ACCOMODATION_FILTERS = "Accomodation filters";
export const APPLY_FILTER = "Apply";
export const CLEAR_SEARCH = "Clear search";
export const FILTER_DIALOG_TITLE = "Filters";
export const HOST_FILTERS = "Host filters";
export const LAST_2_WEEKS = "Last 2 weeks";
export const LAST_3_MONTHS = "Last 3 months";
export const LAST_ACTIVE = "Last active";
export const LAST_DAY = "Last day";
export const LAST_MONTH = "Last month";
export const LAST_WEEK = "Last week";
export const LOCATION = "Near location";
export const MAP_PAGE = "Map page";
export const NUM_GUESTS = "Number of guests";
export const NO_USER_RESULTS = "No users found.";
export const OPEN_FILTER_DIALOG = "Open filter dialog";
export const SEARCH = "Search";
export const SEARCH_LOCATION_HINT = "Press enter to choose a location";
export const SEARCH_LOCATION_BUTTON = "Search location";
export const SELECT_LOCATION = "Select a location from the list";
export const USER_SEARCH = "Search for a user...";

export const getShowUserOnMap = (name: string) => `Show ${name} on the map`;

export const selectedUserZoom = 12;

export type MapClickedCallback = (
  ev: maplibregl.MapMouseEvent & {
    features?: maplibregl.MapboxGeoJSONFeature[] | undefined;
  } & maplibregl.EventData
) => void;

export interface SearchParams extends UserSearchFilters {
  location?: string;
}
