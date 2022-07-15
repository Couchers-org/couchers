import { TFunction } from "i18n";
import {
  HostingStatus,
  MeetupStatus,
  ParkingDetails,
  SleepingArrangement,
  SmokingLocation,
} from "proto/api_pb";
import { ReferenceType } from "proto/references_pb";

export const referencesQueryStaleTime = 10 * 60 * 1000;
export const contactLink = "mailto:support@couchers.org";
export const hostRequestReferenceSuccessDialogId =
  "hostRequestReferneceSuccessDialog";

export const sectionLabels = (t: TFunction) => ({
  about: t("profile:heading.about_me"),
  home: t("profile:heading.home"),
  references: t("profile:heading.references"),
});

export const referencesFilterLabels = (t: TFunction) => ({
  [ReferenceType.REFERENCE_TYPE_FRIEND]: t(
    "profile:reference_filter_label.friend"
  ),
  [ReferenceType.REFERENCE_TYPE_HOSTED]: t(
    "profile:reference_filter_label.hosted"
  ),
  [ReferenceType.REFERENCE_TYPE_SURFED]: t(
    "profile:reference_filter_label.surfed"
  ),
  all: "All references",
  given: "Given to others",
});
export const referenceBadgeLabel = (t: TFunction) => ({
  [ReferenceType.REFERENCE_TYPE_FRIEND]: t(
    "profile:reference_badge_label.surfed"
  ),
  [ReferenceType.REFERENCE_TYPE_HOSTED]: t(
    "profile:reference_badge_label.hosted"
  ),
  [ReferenceType.REFERENCE_TYPE_SURFED]: t(
    "profile:reference_badge_label.friend"
  ),
});

export const smokingLocationLabels = (t: TFunction) => ({
  [SmokingLocation.SMOKING_LOCATION_NO]: t("profile:smoking_location.no"),
  [SmokingLocation.SMOKING_LOCATION_OUTSIDE]: t(
    "profile:smoking_location.outside"
  ),
  [SmokingLocation.SMOKING_LOCATION_WINDOW]: t(
    "profile:smoking_location.window"
  ),
  [SmokingLocation.SMOKING_LOCATION_YES]: t("profile:smoking_location.yes"),
  [SmokingLocation.SMOKING_LOCATION_UNKNOWN]: t("profile:unspecified_info"),
  [SmokingLocation.SMOKING_LOCATION_UNSPECIFIED]: t("profile:unspecified_info"),
});

export const hostingStatusLabels = (t: TFunction) => ({
  [HostingStatus.HOSTING_STATUS_CAN_HOST]: t("global:hosting_status.can_host"),
  [HostingStatus.HOSTING_STATUS_MAYBE]: t("global:hosting_status.maybe"),
  [HostingStatus.HOSTING_STATUS_CANT_HOST]: t(
    "global:hosting_status.cant_host"
  ),
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: t(
    "global:hosting_status.unspecified_info"
  ),
  [HostingStatus.HOSTING_STATUS_UNKNOWN]: t(
    "global:hosting_status.unspecified_info"
  ),
});

export const meetupStatusLabels = (t: TFunction) => ({
  [MeetupStatus.MEETUP_STATUS_WANTS_TO_MEETUP]: t(
    "global:meetup_status.wants_to_meetup"
  ),
  [MeetupStatus.MEETUP_STATUS_OPEN_TO_MEETUP]: t(
    "global:meetup_status.open_to_meetup"
  ),
  [MeetupStatus.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP]: t(
    "global:meetup_status.does_not_want_to_meetup"
  ),
  [MeetupStatus.MEETUP_STATUS_UNSPECIFIED]: t(
    "global:meetup_status.unspecified_info"
  ),
  [MeetupStatus.MEETUP_STATUS_UNKNOWN]: t(
    "global:meetup_status.unspecified_info"
  ),
});

export const sleepingArrangementLabels = (t: TFunction) => ({
  [SleepingArrangement.SLEEPING_ARRANGEMENT_PRIVATE]: t(
    "profile:sleeping_arrangement.private"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_COMMON]: t(
    "profile:sleeping_arrangement.common"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_ROOM]: t(
    "profile:sleeping_arrangement.shared_room"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_SHARED_SPACE]: t(
    "profile:sleeping_arrangement.shared_space"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_UNSPECIFIED]: t(
    "profile:unspecified_info"
  ),
  [SleepingArrangement.SLEEPING_ARRANGEMENT_UNKNOWN]: t(
    "profile:unspecified_info"
  ),
});

export const parkingDetailsLabels = (t: TFunction) => ({
  [ParkingDetails.PARKING_DETAILS_FREE_ONSITE]: t(
    "profile:parking_details.free_onsite"
  ),
  [ParkingDetails.PARKING_DETAILS_FREE_OFFSITE]: t(
    "profile:parking_details.free_offsite"
  ),
  [ParkingDetails.PARKING_DETAILS_PAID_ONSITE]: t(
    "profile:parking_details.paid_onsite"
  ),
  [ParkingDetails.PARKING_DETAILS_PAID_OFFSITE]: t(
    "profile:parking_details.paid_offsite"
  ),
  [ParkingDetails.PARKING_DETAILS_UNSPECIFIED]: t("profile:unspecified_info"),
  [ParkingDetails.PARKING_DETAILS_UNKNOWN]: t("profile:unspecified_info"),
});

export function booleanConversion(t: TFunction, value: boolean | undefined) {
  return value === undefined
    ? t("profile:info_unanswered")
    : value
    ? t("global:yes")
    : t("global:no");
}
