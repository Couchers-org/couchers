import { Timestamp } from "google-protobuf/google/protobuf/timestamp_pb";
import {
  Int64Value,
  StringValue,
} from "google-protobuf/google/protobuf/wrappers_pb";

import { ListEventsReq } from "@/proto/communities_pb";
import {
  AttendanceState,
  CancelEventReq,
  CreateEventReq,
  GetEventReq,
  InviteEventOrganizerReq,
  ListAllEventsReq,
  ListEventAttendeesReq,
  ListEventOrganizersReq,
  ListMyEventsReq,
  OfflineEventInformation,
  OnlineEventInformation,
  RemoveEventOrganizerReq,
  RequestCommunityInviteReq,
  SetEventAttendanceReq,
  UpdateEventReq,
} from "@/proto/events_pb";

import client from "./client";

export const listCommunityEvents = async (
  communityId: number,
  pageToken?: string,
  pageSize?: number,
) => {
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
};

export const getEvent = async (eventId: number) => {
  const req = new GetEventReq();
  req.setEventId(eventId);
  const res = await client.events.getEvent(req);
  return res.toObject();
};

export const cancelEvent = (eventId: number) => {
  const req = new CancelEventReq();
  req.setEventId(eventId);
  return client.events.cancelEvent(req);
};

export const requestCommunityInvite = (eventId: number) => {
  const req = new RequestCommunityInviteReq();
  req.setEventId(eventId);
  return client.events.requestCommunityInvite(req);
};

interface ListEventUsersInput {
  eventId: number;
  pageSize?: number;
  pageToken?: string;
}

export const listEventOrganizers = async ({
  eventId,
  pageSize,
  pageToken,
}: ListEventUsersInput) => {
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
};

export const listEventAttendees = async ({
  eventId,
  pageSize,
  pageToken,
}: ListEventUsersInput) => {
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
};

export const setEventAttendance = async ({
  attendanceState,
  eventId,
}: {
  attendanceState: AttendanceState;
  eventId: number;
}) => {
  const req = new SetEventAttendanceReq();
  req.setEventId(eventId);
  req.setAttendanceState(attendanceState);
  const res = await client.events.setEventAttendance(req);
  return res.toObject();
};

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

export const createEvent = async (input: CreateEventInput) => {
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
};

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
) & { eventId: number; shouldNotify: boolean };

export const updateEvent = async (input: UpdateEventInput) => {
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

  if (input.shouldNotify) {
    req.setShouldNotify(input.shouldNotify);
  }

  const res = await client.events.updateEvent(req);
  return res.toObject();
};

export interface ListAllEventsInput {
  pastEvents: boolean;
  pageSize?: number;
  pageToken?: string;
  showCancelled?: boolean;
}

export const listAllEvents = async ({
  pastEvents = false,
  pageSize,
  pageToken,
  showCancelled,
}: ListAllEventsInput) => {
  const req = new ListAllEventsReq();

  req.setPast(pastEvents);

  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  if (showCancelled !== undefined) {
    req.setIncludeCancelled(showCancelled);
  }

  const res = await client.events.listAllEvents(req);
  return res.toObject();
};

export interface ListMyEventsInput {
  pageNumber?: number;
  pageSize?: number;
  pageToken?: string;
  pastEvents?: boolean;
  showCancelled?: boolean;
}

export const listMyEvents = async ({
  pageNumber,
  pageSize,
  pageToken,
  pastEvents,
  showCancelled,
}: ListMyEventsInput) => {
  const req = new ListMyEventsReq();
  req.setAttending(true);
  req.setOrganizing(true);

  if (pastEvents !== undefined) {
    req.setPast(pastEvents);
  }
  if (pageNumber) {
    req.setPageNumber(pageNumber);
  }
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  if (showCancelled !== undefined) {
    req.setIncludeCancelled(showCancelled);
  }

  const res = await client.events.listMyEvents(req);
  return res.toObject();
};

export const inviteEventOrganizer = async (eventId: number, userId: number) => {
  const req = new InviteEventOrganizerReq();
  req.setEventId(eventId);
  req.setUserId(userId);
  const res = await client.events.inviteEventOrganizer(req);
  return res.toObject();
};

export const removeEventOrganizer = async (eventId: number, userId: number) => {
  const req = new RemoveEventOrganizerReq();
  req.setEventId(eventId);
  req.setUserId(new Int64Value().setValue(userId));
  const res = await client.events.removeEventOrganizer(req);
  return res.toObject();
};
