import {
  CalendarIcon,
  CouchIcon,
  EmailIcon,
  LocationIcon,
} from "components/Icons";
import {
  DISCUSSIONS_LABEL,
  EVENTS_LABEL,
  FIND_HOST,
  HANGOUTS_LABEL,
  LOCAL_POINTS_LABEL,
} from "features/constants";
import { Community } from "pb/communities_pb";
import { routeToCommunityDiscussions, routeToCommunityEvents } from "routes";

import CircularIconButton from "./CircularIconButton";

export default function NavButtons({
  community,
}: {
  community: Community.AsObject;
}) {
  return (
    <>
      <CircularIconButton id="findHostButton" label={FIND_HOST}>
        <CouchIcon />
      </CircularIconButton>
      <CircularIconButton
        id="eventButton"
        label={EVENTS_LABEL}
        linkTo={routeToCommunityEvents(community.communityId, community.slug)}
      >
        <CalendarIcon />
      </CircularIconButton>
      <CircularIconButton id="localPointsButton" label={LOCAL_POINTS_LABEL}>
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
        <CouchIcon />
      </CircularIconButton>
    </>
  );
}
