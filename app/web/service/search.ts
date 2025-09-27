import { create } from "@bufbuild/protobuf";
import { timestampFromDate } from "@bufbuild/protobuf/wkt";
import { API, Search } from "@couchers/services";

import {
  Coordinates,
  DEFAULT_AGE_MAX,
  DEFAULT_AGE_MIN,
} from "@/features/search/utils/constants";
import serviceClients from "@/serviceClients";
import { GeocodeResult } from "@/utils/hooks";

export interface UserSearchFilters {
  acceptsKids?: boolean;
  acceptsPets?: boolean;
  acceptsLastMinRequests?: boolean;
  ageMin?: number;
  ageMax?: number;
  drinkingAllowed?: boolean | undefined;
  query?: string;
  bbox?: Coordinates;
  lastActive?: number; // within x days
  hasReferences?: boolean;
  hasStrongVerification?: boolean;
  hostingStatus?: API.HostingStatus[];
  meetupStatus?: API.MeetupStatus[];
  numGuests?: number;
  showEmptyProfile?: boolean;
  pageNumber?: number;
  pageSize?: number;
  selectedUserId?: bigint;
  sleepingArrangement?: API.SleepingArrangement[];
  smokesAtHome?: boolean | undefined;
}

const constructUserSearchReq = (
  {
    acceptsKids,
    acceptsLastMinRequests,
    acceptsPets,
    ageMin,
    ageMax,
    drinkingAllowed,
    query,
    bbox,
    lastActive,
    hasReferences,
    hasStrongVerification,
    hostingStatus,
    meetupStatus,
    numGuests,
    showEmptyProfile,
    selectedUserId,
    sleepingArrangement,
    smokesAtHome,
  }: UserSearchFilters,
  pageToken = "",
) => {
  const req = create(
    Search.UserSearchReqSchema,
    {},
  ) as Search.UserSearchReqValid;

  req.pageToken = pageToken;
  req.acceptsKids = acceptsKids;
  req.lastMinute = acceptsLastMinRequests;
  req.acceptsPets = acceptsPets;
  req.drinkingAllowed = drinkingAllowed;
  req.query = query;

  if (bbox !== undefined && bbox.join() !== "0,0,0,0") {
    const rect = create(Search.RectAreaSchema) as Search.RectArea;
    rect.lngMin = bbox[0];
    rect.latMin = bbox[1];
    rect.lngMax = bbox[2];
    rect.latMax = bbox[3];

    req.searchIn = {
      case: "searchInRectangle",
      value: rect,
    };
  }

  if (lastActive) {
    req.lastActive = timestampFromDate(
      new Date(Date.now() - 1000 * 60 * 60 * 24 * lastActive),
    );
  }

  req.profileCompleted = !(showEmptyProfile ?? true) || undefined;

  if (hasReferences !== undefined) {
    req.onlyWithReferences = hasReferences;
  }

  if (hasStrongVerification !== undefined) {
    req.onlyWithStrongVerification = hasStrongVerification;
  }

  if (hostingStatus?.length) {
    req.hostingStatusFilter = hostingStatus;
  }

  if (meetupStatus?.length) {
    req.meetupStatusFilter = meetupStatus;
  }

  if (ageMin && ageMin !== DEFAULT_AGE_MIN) {
    req.ageMin = ageMin;
  }

  if (ageMax && ageMax !== DEFAULT_AGE_MAX) {
    req.ageMax = ageMax;
  }

  req.guests = numGuests || undefined;

  if (selectedUserId !== undefined) {
    req.exactlyUserIds.push(selectedUserId);
  }

  if (sleepingArrangement?.length) {
    req.sleepingArrangementFilter = sleepingArrangement;
  }

  req.smokesAtHome = smokesAtHome;

  return req;
};

export const userSearch = async (
  filters: UserSearchFilters,
  pageToken = "",
) => {
  const req = constructUserSearchReq(filters, pageToken);
  return serviceClients.search.userSearch(req);
};

export const userSearchV2 = async (
  filters: UserSearchFilters,
  pageToken = "",
) => {
  const req = constructUserSearchReq(filters, pageToken);
  return serviceClients.search.userSearchV2(req);
};

export const eventSearch = async ({
  pageNumber,
  pageSize,
  pastEvents,
  isMyCommunities,
  isOnlineOnly,
  searchLocation,
}: {
  pageNumber: number;
  pageSize: number;
  pastEvents?: boolean;
  isMyCommunities?: boolean;
  isOnlineOnly?: boolean;
  searchLocation?: GeocodeResult | "";
}): Promise<Search.EventSearchReqValid> => {
  const req = create(Search.EventSearchReqSchema) as Search.EventSearchReqValid;

  req.pageSize = pageSize;
  req.pagination = {
    case: "pageNumber",
    value: pageNumber,
  };

  if (pastEvents !== undefined) {
    req.past = pastEvents;
  }

  if (searchLocation) {
    if (searchLocation.isRegion) {
      req.query = searchLocation.name;
    } else {
      // Otherwise use rectangle search so we get the area around a city
      // This is because if you search a small town, you might want to search around it too
      req.searchIn = {
        case: "searchInRectangle",
        value: create(Search.RectAreaSchema, {
          latMin: searchLocation.bbox[1] || 0,
          latMax: searchLocation.bbox[3] || 0,
          lngMin: searchLocation.bbox[0] || 0,
          lngMax: searchLocation.bbox[2] || 0,
        }) as Search.RectArea,
      };
    }
  }

  if (isMyCommunities !== undefined) {
    req.myCommunities = isMyCommunities;
  }

  if (isOnlineOnly !== undefined) {
    req.onlineStatus = {
      case: "onlyOnline",
      value: isOnlineOnly,
    };
  }

  return serviceClients.search.eventSearch(req);
};
