import { GetLiteUsersRes, LiteUser, User } from "proto/api_pb";
import { ListAdminsRes } from "proto/communities_pb";
import { HostRequestStatus } from "proto/conversations_pb";
import { ListEventAttendeesRes, ListEventOrganizersRes } from "proto/events_pb";
import {
  AvailableWriteReferencesRes,
  ReferenceType,
} from "proto/references_pb";
import comments from "test/fixtures/comments.json";
import liteUsers from "test/fixtures/liteUsers.json";
import messages from "test/fixtures/messages.json";
import users from "test/fixtures/users.json";

const [user1, user2, user3, user4, user5] = users;
const [liteUser1, liteUser2, liteUser3, liteUser4, liteUser5] = liteUsers;

const userMap: Record<string, User.AsObject> = {
  "1": user1,
  "2": user2,
  "3": user3,
  "4": user4,
  "5": user5,
  funnycat: user1,
  funnyChicken: user4,
  funnydog: user2,
  funnykid: user3,
};

const liteUserMap: Record<string, LiteUser.AsObject> = {
  "1": liteUser1,
  "2": liteUser2,
  "3": liteUser3,
  "4": liteUser4,
  "5": liteUser5,
  funnycat: liteUser1,
  funnyChicken: liteUser4,
  funnydog: liteUser2,
  funnykid: liteUser3,
};

export async function getUser(userId: string): Promise<User.AsObject> {
  return userMap[userId];
}

export async function getLiteUser(userId: string): Promise<LiteUser.AsObject> {
  return liteUserMap[userId];
}

export async function getLiteUsers(
  ids: number[]
): Promise<GetLiteUsersRes.AsObject> {
  return {
    responsesList: ids.map((id) => ({
      query: "",
      user: liteUserMap[id.toString()],
      notFound: false,
    })),
  };
}

export async function listFriends() {
  const [, user2, user3] = users;
  return [user2.userId, user3.userId];
}

export async function getGroupChatMessages() {
  return {
    lastMessageId: 5,
    messagesList: messages,
    noMore: true,
  };
}

export async function listGroupChats() {
  return {
    groupChatsList: [
      {
        adminUserIdsList: [],
        groupChatId: 3,
        isDm: false,
        lastSeenMessageId: 4,
        latestMessage: messages[0],
        memberUserIdsList: [],
        onlyAdminsInvite: true,
        title: "groupchattitle",
        // created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        unseenMessageCount: 0,
      },
    ],
    noMore: true,
  };
}

export async function listHostRequests() {
  return [
    {
      created: {
        nanos: 0,
        seconds: Date.now() / 1000,
      },
      fromDate: "2020/12/01",
      surferUserId: 1,
      hostRequestId: 1,
      lastSeenMessageId: 0,
      latestMessage: messages[0],
      status: HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
      toDate: "2020/12/06",
      hostUserId: 2,
    },
  ];
}

export async function getAvailableReferences(): Promise<AvailableWriteReferencesRes.AsObject> {
  return {
    canWriteFriendReference: true,
    availableWriteReferencesList: [
      {
        hostRequestId: 1,
        referenceType: ReferenceType.REFERENCE_TYPE_HOSTED,
      },
    ],
  };
}

export async function getThread(threadId: number) {
  switch (threadId) {
    case 2:
      return {
        nextPageToken: "",
        repliesList: comments.slice(0, 4),
      };
    case 3:
    case 4:
    case 5:
    case 6:
      return {
        nextPageToken: "",
        repliesList: [
          {
            threadId: threadId * 3,
            content: `+${threadId}`,
            authorUserId: 3,
            createdTime: { seconds: 1577920000, nanos: 0 },
            numReplies: 0,
          },
        ],
      };
    default:
      return { nextPageToken: "", repliesList: [] };
  }
}

export async function getLanguages() {
  return {
    languagesList: [
      {
        code: "eng",
        name: "English",
      },
      {
        code: "fra",
        name: "French",
      },
      {
        code: "fin",
        name: "Finnish",
      },
      {
        code: "spa",
        name: "Spanish",
      },
    ],
  };
}

export async function getRegions() {
  return {
    regionsList: [
      {
        alpha3: "USA",
        name: "United States",
      },
      {
        alpha3: "FRA",
        name: "France",
      },
      {
        alpha3: "FIN",
        name: "Finland",
      },
      {
        alpha3: "ESP",
        name: "Spain",
      },
      {
        alpha3: "AUS",
        name: "Australia",
      },
      {
        alpha3: "SWE",
        name: "Sweden",
      },
      {
        alpha3: "CMR",
        name: "Cameroon",
      },
      {
        alpha3: "JPN",
        name: "Japan",
      },
      {
        alpha3: "GBR",
        name: "United Kingdom",
      },
    ],
  };
}

export async function listCommunityAdmins(): Promise<ListAdminsRes.AsObject> {
  return {
    adminUserIdsList: [2, 3],
    nextPageToken: "",
  };
}

export async function getEventOrganizers(): Promise<ListEventOrganizersRes.AsObject> {
  return {
    organizerUserIdsList: [2, 3],
    nextPageToken: "",
  };
}

export async function getEventAttendees(): Promise<ListEventAttendeesRes.AsObject> {
  return {
    attendeeUserIdsList: [1, 4],
    nextPageToken: "",
  };
}
