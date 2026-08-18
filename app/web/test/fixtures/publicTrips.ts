import { PublicTrip, PublicTripStatus } from "proto/public_trips_pb";
import community from "test/fixtures/community.json";
import users from "test/fixtures/users.json";

const [funnyCat, funnyDog, funnyKid, funnyChicken, friendlyCow] = users;

// Trips in the Amsterdam community fixture, so the two line up.
const publicTrips: PublicTrip.AsObject[] = [
  {
    tripId: 1,
    user: funnyDog,
    communityId: community.communityId,
    fromDate: "2026-04-20",
    toDate: "2026-04-27",
    description:
      "Visiting NYC for the first time! I'm a photographer from Helsinki and would love to stay with a local who can show me around. I'm easygoing, tidy, and happy to cook Finnish food for my host.",
    status: PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
    created: { seconds: 1775822400, nanos: 0 },
    communitySlug: community.slug,
    sameGenderOnly: true,
    communityName: community.name,
    viewerHostRequestId: 0,
  },
  {
    tripId: 2,
    user: funnyKid,
    communityId: community.communityId,
    fromDate: "2026-05-01",
    toDate: "2026-05-10",
    description:
      "Passing through on a cross-country road trip. Looking for a couch for a few nights. I'm into live music and street food — if you know good spots, even better!",
    status: PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
    created: { seconds: 1775640600, nanos: 0 },
    communitySlug: community.slug,
    sameGenderOnly: false,
    communityName: community.name,
    viewerHostRequestId: 0,
  },
  {
    tripId: 3,
    user: funnyChicken,
    communityId: community.communityId,
    fromDate: "2026-04-15",
    toDate: "2026-04-18",
    description:
      "Quick weekend visit for a friend's wedding. Would love to meet locals and explore the neighborhood a bit. I'm quiet, respectful, and an early riser.",
    status: PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
    created: { seconds: 1775403900, nanos: 0 },
    communitySlug: community.slug,
    sameGenderOnly: false,
    communityName: community.name,
    viewerHostRequestId: 0,
  },
  {
    tripId: 4,
    user: friendlyCow,
    communityId: community.communityId,
    fromDate: "2026-05-15",
    toDate: "2026-05-25",
    description:
      "Backpacking through the US for a month. I've been traveling for 6 months now and love meeting new people. I can share stories from Southeast Asia and South America! I'm a pretty laid-back person who loves cooking, hiking, and having long conversations over coffee. I've hosted over 50 people back home and know what it's like to open your door to a stranger. I always clean up after myself, bring a small gift for my host, and try to leave the place better than I found it. I'm also happy to help out with anything around the house. If you're into board games or card games, I always travel with a few in my backpack. I'm flexible with dates and can adjust my itinerary if needed. Looking forward to meeting someone awesome!",
    status: PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
    created: { seconds: 1775116800, nanos: 0 },
    communitySlug: community.slug,
    sameGenderOnly: true,
    communityName: community.name,
    viewerHostRequestId: 0,
  },
  {
    tripId: 5,
    user: funnyDog,
    communityId: community.communityId,
    fromDate: "2026-06-01",
    toDate: "2026-06-07",
    description:
      "Coming back to NYC for a photography exhibition. Last time I had an amazing host — hoping to find another great connection this time around.",
    status: PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
    created: { seconds: 1775037600, nanos: 0 },
    communitySlug: community.slug,
    sameGenderOnly: false,
    communityName: community.name,
    viewerHostRequestId: 0,
  },
  {
    tripId: 6,
    user: funnyCat,
    communityId: community.communityId,
    fromDate: "2026-05-20",
    toDate: "2026-05-28",
    description: "Heading to NYC to visit some old friends and explore Brooklyn. Would love a couch to crash on!",
    status: PublicTripStatus.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST,
    created: { seconds: 1776002400, nanos: 0 },
    communitySlug: community.slug,
    sameGenderOnly: false,
    communityName: community.name,
    viewerHostRequestId: 0,
  },
];

export default publicTrips;
