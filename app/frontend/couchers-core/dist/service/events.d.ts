import { AttendanceState } from "proto/events_pb";
export declare function listCommunityEvents(communityId: number, pageToken?: string, pageSize?: number): Promise<import("proto/communities_pb").ListEventsRes.AsObject>;
export declare function getEvent(eventId: number): Promise<import("proto/events_pb").Event.AsObject>;
interface ListEventUsersInput {
    eventId: number;
    pageSize?: number;
    pageToken?: string;
}
export declare function listEventOrganisers({ eventId, pageSize, pageToken, }: ListEventUsersInput): Promise<import("proto/events_pb").ListEventOrganizersRes.AsObject>;
export declare function listEventAttendees({ eventId, pageSize, pageToken, }: ListEventUsersInput): Promise<import("proto/events_pb").ListEventAttendeesRes.AsObject>;
export declare function setEventAttendance({ attendanceState, eventId, }: {
    attendanceState: AttendanceState;
    eventId: number;
}): Promise<import("proto/events_pb").Event.AsObject>;
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
export declare type CreateEventInput = OnlineEventInput | OfflineEventInput;
export declare function createEvent(input: CreateEventInput): Promise<import("proto/events_pb").Event.AsObject>;
declare type UpdateOnlineEventInput = Omit<OnlineEventInput, "parentCommunityId">;
declare type UpdateOfflineEventInput = Omit<OfflineEventInput, "parentCommunityId">;
export declare type UpdateEventInput = (UpdateOnlineEventInput | UpdateOfflineEventInput) & {
    eventId: number;
};
export declare function updateEvent(input: UpdateEventInput): Promise<import("proto/events_pb").Event.AsObject>;
export {};
//# sourceMappingURL=events.d.ts.map