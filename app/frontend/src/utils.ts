import moment from "moment"
import { HostingStatus } from "./pb/api_pb"
import colors, { Color } from "vuetify/lib/util/colors"

export function displayList(list: string[]) {
  return list.join(", ")
}

export function displayTime(ts: { seconds: number; nanos: number }) {
  return moment(new Date(ts.seconds * 1000 + ts.nanos / 1000000)).fromNow()
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
