import { ListEventsReq } from "proto/communities_pb";
import {
  AttendanceState,
  GetEventReq,
  ListEventAttendeesReq,
  ListEventOrganizersReq,
  SetEventAttendanceReq,
} from "proto/events_pb";
import client from "service/client";

export async function listCommunityEvents(
  communityId: number,
  pageToken?: string,
  pageSize?: number
) {
  const req = new ListEventsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  if (pageSize) {
    req.setPageSize(pageSize);
  }

  const res = await client.communities.listEvents(req);
  return res.toObject();
}

export async function getEvent(eventId: number) {
  const req = new GetEventReq();
  req.setEventId(eventId);
  const res = await client.events.getEvent(req);
  return res.toObject();
}

interface ListEventUsersInput {
  eventId: number;
  pageSize?: number;
}

export async function listEventOrganisers({
  eventId,
  pageSize,
}: ListEventUsersInput) {
  const req = new ListEventOrganizersReq();
  req.setEventId(eventId);
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  const res = await client.events.listEventOrganizers(req);
  return res.toObject();
}

export async function listEventAttendees({
  eventId,
  pageSize,
}: ListEventUsersInput) {
  const req = new ListEventAttendeesReq();
  req.setEventId(eventId);
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  const res = await client.events.listEventAttendees(req);
  return res.toObject();
}

export async function setEventAttendance({
  attendanceState,
  eventId,
}: {
  attendanceState: AttendanceState;
  eventId: number;
}) {
  const req = new SetEventAttendanceReq();
  req.setEventId(eventId);
  req.setAttendanceState(attendanceState);
  const res = await client.events.setEventAttendance(req);
  return res.toObject();
}
