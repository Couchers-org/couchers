import { User } from "proto/api_pb";
export declare function listGroupChats(lastMessageId?: number, count?: number): Promise<import("proto/conversations_pb").ListGroupChatsRes.AsObject>;
export declare function getGroupChat(id: number): Promise<import("proto/conversations_pb").GroupChat.AsObject>;
export declare function getGroupChatMessages(groupChatId: number, lastMessageId?: number, count?: number): Promise<import("proto/conversations_pb").GetGroupChatMessagesRes.AsObject>;
export declare function createGroupChat(title: string, users: User.AsObject[]): Promise<number>;
export declare function sendMessage(groupChatId: number, text: string): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty>;
export declare function leaveGroupChat(groupChatId: number): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty>;
export declare function inviteToGroupChat(groupChatId: number, users: User.AsObject[]): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty[]>;
export declare function makeGroupChatAdmin(groupChatId: number, user: User.AsObject): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty>;
export declare function removeGroupChatAdmin(groupChatId: number, user: User.AsObject): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty>;
export declare function editGroupChat(groupChatId: number, title?: string, onlyAdminsInvite?: boolean): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty>;
export declare function markLastSeenGroupChat(groupChatId: number, lastSeenMessageId: number): Promise<import("google-protobuf/google/protobuf/empty_pb").Empty>;
export declare function getDirectMessage(userId: number): Promise<number | false>;
//# sourceMappingURL=conversations.d.ts.map