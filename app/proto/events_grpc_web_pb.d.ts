import * as grpcWeb from 'grpc-web';

import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb'; // proto import: "google/protobuf/empty.proto"
import * as events_pb from './events_pb'; // proto import: "events.proto"


export class EventsClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createEvent(
    request: events_pb.CreateEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<events_pb.Event>;

  scheduleEvent(
    request: events_pb.ScheduleEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<events_pb.Event>;

  updateEvent(
    request: events_pb.UpdateEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<events_pb.Event>;

  getEvent(
    request: events_pb.GetEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<events_pb.Event>;

  cancelEvent(
    request: events_pb.CancelEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  requestCommunityInvite(
    request: events_pb.RequestCommunityInviteReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listEventOccurrences(
    request: events_pb.ListEventOccurrencesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.ListEventOccurrencesRes) => void
  ): grpcWeb.ClientReadableStream<events_pb.ListEventOccurrencesRes>;

  listEventAttendees(
    request: events_pb.ListEventAttendeesReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.ListEventAttendeesRes) => void
  ): grpcWeb.ClientReadableStream<events_pb.ListEventAttendeesRes>;

  listEventSubscribers(
    request: events_pb.ListEventSubscribersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.ListEventSubscribersRes) => void
  ): grpcWeb.ClientReadableStream<events_pb.ListEventSubscribersRes>;

  listEventOrganizers(
    request: events_pb.ListEventOrganizersReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.ListEventOrganizersRes) => void
  ): grpcWeb.ClientReadableStream<events_pb.ListEventOrganizersRes>;

  transferEvent(
    request: events_pb.TransferEventReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<events_pb.Event>;

  setEventSubscription(
    request: events_pb.SetEventSubscriptionReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<events_pb.Event>;

  setEventAttendance(
    request: events_pb.SetEventAttendanceReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.Event) => void
  ): grpcWeb.ClientReadableStream<events_pb.Event>;

  inviteEventOrganizer(
    request: events_pb.InviteEventOrganizerReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  removeEventOrganizer(
    request: events_pb.RemoveEventOrganizerReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: google_protobuf_empty_pb.Empty) => void
  ): grpcWeb.ClientReadableStream<google_protobuf_empty_pb.Empty>;

  listMyEvents(
    request: events_pb.ListMyEventsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.ListMyEventsRes) => void
  ): grpcWeb.ClientReadableStream<events_pb.ListMyEventsRes>;

  listAllEvents(
    request: events_pb.ListAllEventsReq,
    metadata: grpcWeb.Metadata | undefined,
    callback: (err: grpcWeb.RpcError,
               response: events_pb.ListAllEventsRes) => void
  ): grpcWeb.ClientReadableStream<events_pb.ListAllEventsRes>;

}

export class EventsPromiseClient {
  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; });

  createEvent(
    request: events_pb.CreateEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.Event>;

  scheduleEvent(
    request: events_pb.ScheduleEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.Event>;

  updateEvent(
    request: events_pb.UpdateEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.Event>;

  getEvent(
    request: events_pb.GetEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.Event>;

  cancelEvent(
    request: events_pb.CancelEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  requestCommunityInvite(
    request: events_pb.RequestCommunityInviteReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listEventOccurrences(
    request: events_pb.ListEventOccurrencesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.ListEventOccurrencesRes>;

  listEventAttendees(
    request: events_pb.ListEventAttendeesReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.ListEventAttendeesRes>;

  listEventSubscribers(
    request: events_pb.ListEventSubscribersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.ListEventSubscribersRes>;

  listEventOrganizers(
    request: events_pb.ListEventOrganizersReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.ListEventOrganizersRes>;

  transferEvent(
    request: events_pb.TransferEventReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.Event>;

  setEventSubscription(
    request: events_pb.SetEventSubscriptionReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.Event>;

  setEventAttendance(
    request: events_pb.SetEventAttendanceReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.Event>;

  inviteEventOrganizer(
    request: events_pb.InviteEventOrganizerReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  removeEventOrganizer(
    request: events_pb.RemoveEventOrganizerReq,
    metadata?: grpcWeb.Metadata
  ): Promise<google_protobuf_empty_pb.Empty>;

  listMyEvents(
    request: events_pb.ListMyEventsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.ListMyEventsRes>;

  listAllEvents(
    request: events_pb.ListAllEventsReq,
    metadata?: grpcWeb.Metadata
  ): Promise<events_pb.ListAllEventsRes>;

}

