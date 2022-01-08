import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { ListEventsReq } from "proto/communities_pb";
import {
  AttendanceState,
  CreateEventReq,
  GetEventReq,
  ListAllEventsReq,
  ListEventAttendeesReq,
  ListEventOrganizersReq,
  ListMyEventsReq,
  OfflineEventInformation,
  OnlineEventInformation,
  SetEventAttendanceReq,
  UpdateEventReq,
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

export async function listEventOrganizers({
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
  parentCommunityId?: number;
}

export type CreateEventInput = OnlineEventInput | OfflineEventInput;

export async function createEvent(input: CreateEventInput) {
  const req = new CreateEventReq();
  req.setTitle(input.title);
  req.setContent(input.content);
  req.setStartTime(Timestamp.fromDate(input.startTime));
  req.setEndTime(Timestamp.fromDate(input.endTime));

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

    if (input.parentCommunityId) {
      req.setParentCommunityId(input.parentCommunityId);
    }
  }

  const res = await client.events.createEvent(req);
  return res.toObject();
}

export interface UpdateOnlineEventInput
  extends Partial<Omit<OnlineEventInput, "parentCommunityId">> {
  isOnline: true;
}
export interface UpdateOfflineEventInput
  extends Partial<Omit<OfflineEventInput, "parentCommunityId">> {
  isOnline: false;
}
export type UpdateEventInput = (
  | UpdateOnlineEventInput
  | UpdateOfflineEventInput
) & { eventId: number };

export async function updateEvent(input: UpdateEventInput) {
  const req = new UpdateEventReq();
  req.setEventId(input.eventId);
  if (input.title) {
    req.setTitle(new StringValue().setValue(input.title));
  }
  if (input.content) {
    req.setContent(new StringValue().setValue(input.content));
  }
  if (input.startTime) {
    req.setStartTime(Timestamp.fromDate(input.startTime));
  }
  if (input.endTime) {
    req.setEndTime(Timestamp.fromDate(input.endTime));
  }

  if (input.photoKey) {
    req.setPhotoKey(new StringValue().setValue(input.photoKey));
  }

  if (input.isOnline) {
    if (input.link) {
      const onlineEventInfo = new OnlineEventInformation();
      onlineEventInfo.setLink(input.link);
      req.setOnlineInformation(onlineEventInfo);
    }
  } else if (input.address && input.lat && input.lng) {
    const offlineEventInfo = new OfflineEventInformation();
    offlineEventInfo.setAddress(input.address);
    offlineEventInfo.setLat(input.lat);
    offlineEventInfo.setLng(input.lng);
    req.setOfflineInformation(offlineEventInfo);
  }

  const res = await client.events.updateEvent(req);
  return res.toObject();
}

export interface ListAllEventsInput {
  pastEvents: boolean;
  pageSize?: number;
  pageToken?: string;
}

export async function listAllEvents({
  pastEvents = false,
  pageSize,
  pageToken,
}: ListAllEventsInput) {
  const req = new ListAllEventsReq();
  req.setPast(pastEvents);

  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (pageToken) {
    req.setPageToken(pageToken);
  }

  const res = await client.events.listAllEvents(req);
  return res.toObject();
}

interface ListMyEventsInput {
  pageSize?: number;
  pageToken?: string;
}

export async function listMyEvents({ pageSize, pageToken }: ListMyEventsInput) {
  const req = new ListMyEventsReq();
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (pageToken) {
    req.setPageToken(pageToken);
  }

  const res = await client.events.listMyEvents(req);
  return res.toObject();
}
