import { TFunction } from "@/i18n";
import { HostingStatus, SleepingArrangement } from "@/proto/api_pb";
import { SearchUser } from "@/proto/search_pb";
import { firstName } from "@/utils/names";

const aboutText = (user: SearchUser.AsObject, t: TFunction) => {
  const missingAbout = user.profileSnippet.length === 0;

  return missingAbout
    ? t("search:search_result.missing_about_description", {
        name: firstName(user.name),
      })
    : user.profileSnippet;
};

const truncateWithEllipsis = (str: string, maxLength = 40): string =>
  str.length > maxLength ? str.slice(0, maxLength) + "…" : str;

enum LastActiveOptions {
  any = 0,
  lastWeek = 7,
  lastMonth = 31,
  lastThreeMonths = 93,
  lastSixMonths = 183,
  lastYear = 365,
}

const SELECTED_USER_ZOOM = 10;

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
const MAX_MAP_ZOOM_LEVEL_FOR_SEARCH = 8;

type MapSearchTypes = "location" | "keyword";

enum MapViews {
  mapAndList = "MAP_AND_LIST",
  listOnly = "LIST_ONLY",
}

type MapViewOptions = MapViews.mapAndList | MapViews.listOnly;

const MAX_ZOOM_LEVEL = 15;
const MIN_ZOOM_LEVEL = 0;

export {
  aboutText,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
  LastActiveOptions as lastActiveOptions,
  MapViews,
  MAX_MAP_ZOOM_LEVEL_FOR_SEARCH,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  SELECTED_USER_ZOOM as selectedUserZoom,
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
