import {
  CalendarIcon,
  CommunityIcon,
  CouchIcon,
  EmailIcon,
  LocationIcon,
  PersonIcon,
} from "components/Icons";
import {
  DISCUSSIONS_LABEL,
  EVENTS_LABEL,
  FIND_HOST,
  HANGOUTS_LABEL,
  LOCAL_INFO_LABEL,
  OVERVIEW_LABEL,
} from "features/constants";
import { Community } from "pb/communities_pb";
import {
  routeToCommunity,
  routeToCommunityDiscussions,
  routeToCommunityEvents,
  routeToCommunityInfo,
  routeToSearch,
} from "routes";

import CircularIconButton from "./CircularIconButton";

export default function NavButtons({
  community,
}: {
  community: Community.AsObject;
}) {
  return (
    <>
      <CircularIconButton
        id="communityHomeButton"
        label={OVERVIEW_LABEL}
        linkTo={routeToCommunity(community.communityId, community.slug)}
        exact
      >
        <CommunityIcon />
      </CircularIconButton>
      <CircularIconButton
        id="findHostButton"
        label={FIND_HOST}
        linkTo={routeToSearch(community.name)}
      >
        <CouchIcon />
      </CircularIconButton>
      <CircularIconButton
        id="eventButton"
        label={EVENTS_LABEL}
        linkTo={routeToCommunityEvents(community.communityId, community.slug)}
      >
        <CalendarIcon />
      </CircularIconButton>
      <CircularIconButton
        id="localPointsButton"
        label={LOCAL_INFO_LABEL}
        linkTo={routeToCommunityInfo(community.communityId, community.slug)}
      >
        <LocationIcon />
      </CircularIconButton>
      <CircularIconButton
        id="discussButton"
        label={DISCUSSIONS_LABEL}
        linkTo={routeToCommunityDiscussions(
          community.communityId,
          community.slug
        )}
      >
        <EmailIcon />
      </CircularIconButton>
      <CircularIconButton id="hangoutsButton" label={HANGOUTS_LABEL} disabled>
        <PersonIcon />
      </CircularIconButton>
    </>
  );
}
