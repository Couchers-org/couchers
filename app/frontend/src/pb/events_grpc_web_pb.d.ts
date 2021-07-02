import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as pb_events_pb from '../pb/events_pb';


export class EventsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createEvent(
    request: pb_events_pb.CreateEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.Event>;

  scheduleEvent(
    request: pb_events_pb.ScheduleEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.Event>;

  updateEvent(
    request: pb_events_pb.UpdateEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.Event>;

  getEvent(
    request: pb_events_pb.GetEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.Event>;

  listEventOccurrences(
    request: pb_events_pb.ListEventOccurrencesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.ListEventOccurrencesRes) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.ListEventOccurrencesRes>;

  listEventAttendees(
    request: pb_events_pb.ListEventAttendeesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.ListEventAttendeesRes) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.ListEventAttendeesRes>;

  listEventSubscribers(
    request: pb_events_pb.ListEventSubscribersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.ListEventSubscribersRes) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.ListEventSubscribersRes>;

  listEventOrganizers(
    request: pb_events_pb.ListEventOrganizersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.ListEventOrganizersRes) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.ListEventOrganizersRes>;

  transferEvent(
    request: pb_events_pb.TransferEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.Event>;

  setEventSubscription(
    request: pb_events_pb.SetEventSubscriptionReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.Event>;

  setEventAttendance(
    request: pb_events_pb.SetEventAttendanceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.Event>;

  inviteEventOrganizer(
    request: pb_events_pb.InviteEventOrganizerReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeEventOrganizer(
    request: pb_events_pb.RemoveEventOrganizerReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listMyEvents(
    request: pb_events_pb.ListMyEventsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.Error,
               response: pb_events_pb.ListMyEventsRes) => void
  ): grpcWeb.ClientReadableStream<pb_events_pb.ListMyEventsRes>;

}

export class EventsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createEvent(
    request: pb_events_pb.CreateEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.Event>;

  scheduleEvent(
    request: pb_events_pb.ScheduleEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.Event>;

  updateEvent(
    request: pb_events_pb.UpdateEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.Event>;

  getEvent(
    request: pb_events_pb.GetEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.Event>;

  listEventOccurrences(
    request: pb_events_pb.ListEventOccurrencesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.ListEventOccurrencesRes>;

  listEventAttendees(
    request: pb_events_pb.ListEventAttendeesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.ListEventAttendeesRes>;

  listEventSubscribers(
    request: pb_events_pb.ListEventSubscribersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.ListEventSubscribersRes>;

  listEventOrganizers(
    request: pb_events_pb.ListEventOrganizersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.ListEventOrganizersRes>;

  transferEvent(
    request: pb_events_pb.TransferEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.Event>;

  setEventSubscription(
    request: pb_events_pb.SetEventSubscriptionReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.Event>;

  setEventAttendance(
    request: pb_events_pb.SetEventAttendanceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.Event>;

  inviteEventOrganizer(
    request: pb_events_pb.InviteEventOrganizerReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeEventOrganizer(
    request: pb_events_pb.RemoveEventOrganizerReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listMyEvents(
    request: pb_events_pb.ListMyEventsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<pb_events_pb.ListMyEventsRes>;

}

