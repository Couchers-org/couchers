import { HostingStatus } from "../../../pb/api_pb";

export const optionLabels = {
  [HostingStatus.HOSTING_STATUS_CAN_HOST]: "Can host",
  [HostingStatus.HOSTING_STATUS_MAYBE]: "Can maybe host",
  [HostingStatus.HOSTING_STATUS_DIFFICULT]: "Difficult to host",
  [HostingStatus.HOSTING_STATUS_CANT_HOST]: "Can't host",
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: "",
  [HostingStatus.HOSTING_STATUS_UNKNOWN]: "",
};
