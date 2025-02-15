import { TFunction } from "i18n";
import { HostingStatus, User } from "proto/api_pb";
import { firstName } from "utils/names";

const aboutText = (user: User.AsObject, t: TFunction) => {
  const missingAbout = user.aboutMe.length === 0;
  return missingAbout
    ? t("search:search_result.missing_about_description", {
        name: firstName(user?.name),
      })
    : user.aboutMe.length < 300
      ? user.aboutMe
      : user.aboutMe.substring(0, 300) + "...";
};

enum lastActiveOptions {
  LAST_ACTIVE_ANY = 0,
  LAST_ACTIVE_LAST_DAY = 1,
  LAST_ACTIVE_LAST_WEEK = 7,
  LAST_ACTIVE_LAST_2_WEEKS = 14,
  LAST_ACTIVE_LAST_MONTH = 31,
  LAST_ACTIVE_LAST_3_MONTHS = 93,
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

export { aboutText, lastActiveOptions, selectedUserZoom };
export type { Coordinates, HostingStatusOptions, HostingStatusType };
