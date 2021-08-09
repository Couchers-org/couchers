import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { ListEventsReq } from "proto/communities_pb";
import {
  AttendanceState,
  CreateEventReq,
  GetEventReq,
  ListEventAttendeesReq,
  ListEventOrganizersReq,
  OfflineEventInformation,
  OnlineEventInformation,
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
  pageToken?: string;
}

export async function listEventOrganisers({
  eventId,
  pageSize,
  pageToken,
}: ListEventUsersInput) {
  const req = new ListEventOrganizersReq();
  req.setEventId(eventId);
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const res = await client.events.listEventOrganizers(req);
  return res.toObject();
}

export async function listEventAttendees({
  eventId,
  pageSize,
  pageToken,
}: ListEventUsersInput) {
  const req = new ListEventAttendeesReq();
  req.setEventId(eventId);
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (pageToken) {
    req.setPageToken(pageToken);
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

interface EventInput {
  content: string;
  photoKey?: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

interface OnlineEventInput extends EventInput {
  isOnline: true;
  parentCommunityId: number;
  link: string;
}

interface OfflineEventInput extends EventInput {
  isOnline: false;
  address: string;
  lat: number;
  lng: number;
}

export type CreateEventInput = OnlineEventInput | OfflineEventInput;

export async function createEvent(input: CreateEventInput) {
  const req = new CreateEventReq();
  req.setTitle(input.title);
  req.setContent(input.content);
  req.setStartTime(Timestamp.fromDate(input.startTime));
  req.setEndTime(Timestamp.fromDate(input.endTime));
  req.setTimezone("UTC");

  if (input.photoKey) {
    req.setPhotoKey(input.photoKey);
  }

  if (input.isOnline) {
    const onlineEventInfo = new OnlineEventInformation();
    onlineEventInfo.setLink(input.link);
    req.setParentCommunityId(input.parentCommunityId);
    req.setOnlineInformation(onlineEventInfo);
  } else {
    const offlineEventInfo = new OfflineEventInformation();
    offlineEventInfo.setAddress(input.address);
    offlineEventInfo.setLat(input.lat);
    offlineEventInfo.setLng(input.lng);
    req.setOfflineInformation(offlineEventInfo);
  }

  const res = await client.events.createEvent(req);
  return res.toObject();
}
