import {
  BirthdateVerificationStatus,
  GenderVerificationStatus,
  GetLiteUsersRes,
  LiteUser,
  Profile,
  User,
} from "proto/api_pb";
import { GetBlockedUsersRes } from "proto/blocking_pb";
import { ListAdminsRes } from "proto/communities_pb";
import { ListEventAttendeesRes, ListEventOrganizersRes } from "proto/events_pb";
import { ListNotificationsRes } from "proto/notifications_pb";
import {
  AvailableWriteReferencesRes,
  ReferenceType,
} from "proto/references_pb";
import { EventSearchRes } from "proto/search_pb";
import comments from "test/fixtures/comments.json";
import events from "test/fixtures/events.json";
import liteUsers from "test/fixtures/liteUsers.json";
import messages from "test/fixtures/messages.json";
import notifications from "test/fixtures/notifications.json";
import users from "test/fixtures/users.json";

import { ProfilePublicVisibility } from "../proto/account_pb";

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

export async function getProfile(userId: string): Promise<Profile.AsObject> {
  // users.json fixtures still carry profile-shaped fields, so we can reuse them.
  return userMap[userId] as unknown as Profile.AsObject;
}

export async function getLiteUser(userId: string): Promise<LiteUser.AsObject> {
  return liteUserMap[userId];
}

export async function getLiteUsers(
  ids: number[] | string[],
): Promise<GetLiteUsersRes.AsObject> {
  return {
    responsesList: ids.map((id) => ({
      query: "",
      user: liteUserMap[id.toString()],
      notFound: false,
    })),
  };
}

export async function getBlockedUsers(): Promise<GetBlockedUsersRes.AsObject> {
  return {
    blockedUsersList: [
      {
        username: liteUser1.username,
        name: liteUser1.name,
        avatarThumbnailUrl: liteUser1.avatarThumbnailUrl,
      },
      {
        username: liteUser2.username,
        name: liteUser2.name,
        avatarThumbnailUrl: liteUser2.avatarThumbnailUrl,
      },
      {
        username: liteUser3.username,
        name: liteUser3.name,
        avatarThumbnailUrl: liteUser3.avatarThumbnailUrl,
      },
    ],
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

export async function getAccountInfo() {
  return {
    username: "testuser",
    email: "testuser@test.com",
    profileComplete: true,
    myHomeComplete: true,
    phone: "+46701740605",
    phoneVerified: true,
    timezone: "Australia/Melbourne",
    hasDonated: false,
    hasStrongVerification: false,
    birthdateVerificationStatus:
      BirthdateVerificationStatus.BIRTHDATE_VERIFICATION_STATUS_UNVERIFIED,
    genderVerificationStatus:
      GenderVerificationStatus.GENDER_VERIFICATION_STATUS_UNVERIFIED,
    doNotEmail: false,
    isSuperuser: false,
    uiLanguagePreference: "en",
    profilePublicVisibility:
      ProfilePublicVisibility.PROFILE_PUBLIC_VISIBILITY_NOTHING,
    isVolunteer: false,
    shouldShowDonationBanner: false,
  };
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

export async function listNotifications(): Promise<ListNotificationsRes.AsObject> {
  return notifications;
}

export async function getEvents(): Promise<EventSearchRes.AsObject> {
  return {
    eventsList: events,
    totalItems: events.length,
    nextPageToken: "",
  };
}

export async function getMyEvents(
  creatorUserId?: number,
): Promise<EventSearchRes.AsObject> {
  return {
    eventsList: !creatorUserId
      ? events
      : events.filter((event) => event.creatorUserId === creatorUserId),
    totalItems: events.length,
    nextPageToken: "",
  };
}
