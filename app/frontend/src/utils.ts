import moment from "moment"
import { HostingStatus, SmokingLocation } from "./pb/api_pb"
import colors from "vuetify/lib/util/colors"
import { HostRequestStatus } from "./pb/requests_pb"

export function displayList(list: string[]) {
  return list.join(", ")
}

export interface ProtobufTimestamp {
  seconds: number
  nanos: number
}

export function protobufTimestampToDate(ts: ProtobufTimestamp): Date {
  return new Date(ts.seconds * 1000 + ts.nanos / 1000000)
}

export function displayTime(ts: ProtobufTimestamp) {
  return moment(protobufTimestampToDate(ts)).fromNow()
}

export function handle(username: string): string {
  return "@" + username
}

/// Returns a tuple of text to display and an appropriate color
export function displayHostingStatus(
  hostingStatus: HostingStatus
): [string, string] {
  switch (hostingStatus) {
    case HostingStatus.HOSTING_STATUS_CAN_HOST:
      return ["Can host", colors.green.base]
    case HostingStatus.HOSTING_STATUS_MAYBE:
      return ["Can maybe host", colors.orange.base]
    case HostingStatus.HOSTING_STATUS_DIFFICULT:
      return ["Difficult for me to host", colors.deepOrange.base]
    case HostingStatus.HOSTING_STATUS_CANT_HOST:
      return ["Can't host", colors.red.base]
    default:
      return ["", colors.red.base]
  }
}

/// Prints Yes or No for a bool
export function displayBool(b: boolean): string {
  return b ? "Yes" : "No"
}

/// Returns a text to display for SmokingLocation enum
export function displaySmokingLocation(
  smokingLocation: SmokingLocation
): string {
  switch (smokingLocation) {
    case SmokingLocation.SMOKING_LOCATION_NO:
      return "No"
    case SmokingLocation.SMOKING_LOCATION_OUTSIDE:
      return "Outside only"
    case SmokingLocation.SMOKING_LOCATION_WINDOW:
      return "Window only"
    case SmokingLocation.SMOKING_LOCATION_YES:
      return "Yes"
    default:
      return ""
  }
}

/// Returns a text to display for HostRequestStatus enum
export function displayHostRequestStatus(
  hostRequestStatus: HostRequestStatus
): string {
  switch (hostRequestStatus) {
    case HostRequestStatus.HOST_REQUEST_STATUS_PENDING:
      return "Pending"
    case HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED:
      return "Accepted"
    case HostRequestStatus.HOST_REQUEST_STATUS_REJECTED:
      return "Rejected"
    case HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED:
      return "Confirmed"
    case HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED:
      return "Cancelled"
    default:
      return ""
  }
}
