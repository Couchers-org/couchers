import { HostingStatus } from "./pb/api_pb";

export const hostingStatusLabels = {
  [HostingStatus.HOSTING_STATUS_CAN_HOST]: "Can host",
  [HostingStatus.HOSTING_STATUS_MAYBE]: "Can maybe host",
  [HostingStatus.HOSTING_STATUS_DIFFICULT]: "Hosting is difficult",
  [HostingStatus.HOSTING_STATUS_CANT_HOST]: "Can't host",
  [HostingStatus.HOSTING_STATUS_UNSPECIFIED]: "Blank hosting ability",
  [HostingStatus.HOSTING_STATUS_UNKNOWN]: "Unknown hosting ability",
};
