import { TFunction } from "@/i18n";
import { HostingStatus, MeetupStatus } from "@/proto/api_pb";

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