import { HostRequestStatus } from "proto/messages_pb";
import { HostRequest } from "proto/requests_pb";

// The default test user (id 1) is the surfer on this request; user 2 is the host.
// Spread the real default shape first: toObject() sends every field, filling unset scalars with
// 0/""/false, so this can't drift into a shape the API never returns. Lines below are the
// deliberate test data.
const hostRequest: HostRequest.AsObject = {
  ...new HostRequest().toObject(),
  hostRequestId: 1,
  surferUserId: 1,
  hostUserId: 2,
  status: HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
  created: { seconds: 1577800000, nanos: 0 },
  fromDate: "2025-01-01",
  toDate: "2025-01-05",
  unseenMessageCount: 5,
  lastSeenMessageId: 0,
  latestMessage: {
    messageId: 5,
    authorUserId: 3,
    text: { text: "In 2 hours?" },
    time: { seconds: 1577900000, nanos: 0 },
  },
  hostingCity: "Berlin",
  hostingLat: 52.52,
  hostingLng: 13.405,
  hostingRadius: 500,
  needHostRequestFeedback: false,
  isArchived: false,
};

export default hostRequest;
