import { Feature, GeoJsonProperties, Geometry } from "geojson";
import { TFunction } from "i18n";
import { Event as MaplibreEvent, MapMouseEvent } from "maplibre-gl";
import { User } from "proto/api_pb";
import { UserSearchFilters } from "service/search";
import { firstName } from "utils/names";

export const aboutText = (user: User.AsObject, t: TFunction) => {
  const missingAbout = user.aboutMe.length === 0;
  return missingAbout
    ? t("search:search_result.missing_about_description", {
        name: firstName(user?.name),
      })
    : user.aboutMe.length < 300
    ? user.aboutMe
    : user.aboutMe.substring(0, 300) + "...";
};

export enum lastActiveOptions {
  LAST_ACTIVE_ANY = 0,
  LAST_ACTIVE_LAST_DAY = 1,
  LAST_ACTIVE_LAST_WEEK = 7,
  LAST_ACTIVE_LAST_2_WEEKS = 14,
  LAST_ACTIVE_LAST_MONTH = 31,
  LAST_ACTIVE_LAST_3_MONTHS = 93,
}

export const selectedUserZoom = 10;

export type Coordinates = [number, number, number, number];

export type MapClickedCallback = (
  ev: MapMouseEvent & {
    features?: Feature<Geometry, GeoJsonProperties>[] | undefined;
  } & MaplibreEvent
) => void;

export interface SearchParams extends UserSearchFilters {
  location?: string;
}
