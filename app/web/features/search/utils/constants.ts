import { TFunction } from "i18n";
import { HostingStatus, SleepingArrangement, User } from "proto/api_pb";
import { firstName } from "utils/names";

const aboutText = (user: User.AsObject, t: TFunction) => {
  const missingAbout = user.aboutMe.length === 0;

  return missingAbout
    ? t("search:search_result.missing_about_description", {
        name: firstName(user?.name),
      })
    : user.aboutMe;
};

const truncateWithEllipsis = (str: string, maxLength = 40): string =>
  str.length > maxLength ? str.slice(0, maxLength) + "…" : str;

enum lastActiveOptions {
  LAST_ACTIVE_ANY = 0,
  LAST_ACTIVE_LAST_WEEK = 7,
  LAST_ACTIVE_LAST_MONTH = 31,
  LAST_ACTIVE_LAST_3_MONTHS = 93,
  LAST_ACTIVE_LAST_SIX_MONTHS = 183,
  LAST_ACTIVE_LAST_YEAR = 365,
}

const selectedUserZoom = 10;

type Coordinates = [number, number, number, number];

type HostingStatusType = Exclude<
  HostingStatus,
  | HostingStatus.HOSTING_STATUS_UNKNOWN
  | HostingStatus.HOSTING_STATUS_UNSPECIFIED
>[];

type HostingStatusOptions =
  | HostingStatus.HOSTING_STATUS_CANT_HOST
  | HostingStatus.HOSTING_STATUS_MAYBE
  | HostingStatus.HOSTING_STATUS_CAN_HOST;

type SleepingArrangementOptions =
  | SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON
  | SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE
  | SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM;

const DEFAULT_AGE_MIN = 18;
const DEFAULT_AGE_MAX = 120;
const MAX_MAP_ZOOM_LEVEL_FOR_SEARCH = 7;

type MapSearchTypes = "location" | "keyword";

enum MapViews {
  MAP_AND_LIST = "MAP_AND_LIST",
  LIST_ONLY = "LIST_ONLY",
}

type MapViewOptions = MapViews.MAP_AND_LIST | MapViews.LIST_ONLY;

const MAX_ZOOM_LEVEL = 15;
const MIN_ZOOM_LEVEL = 0;

export {
  aboutText,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  lastActiveOptions,
  MapViews,
  MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  selectedUserZoom,
  truncateWithEllipsis,
};

export type {
  Coordinates,
  HostingStatusOptions,
  HostingStatusType,
  MapSearchTypes,
  MapViewOptions,
  SleepingArrangementOptions,
};
