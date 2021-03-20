import Alert from "components/Alert";
import CircularProgress from "components/CircularProgress";
import HorizontalScroller from "components/HorizontalScroller";
import IconButton from "components/IconButton";
import { InfoIcon, MoreIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { useListPlaces } from "features/communities/useCommunity";
import { PLACES_EMPTY_STATE, SEE_MORE_PLACES_LABEL } from "features/constants";
import { Community } from "pb/communities_pb";
import React from "react";
import { Link } from "react-router-dom";
import { routeToCommunityPlaces } from "routes";

import { useCommunityPageStyles } from "./CommunityPage";
import PlaceCard from "./PlaceCard";
import SectionTitle from "./SectionTitle";

export default function PlacesSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const classes = useCommunityPageStyles();

  const {
    isLoading: isPlacesLoading,
    error: placesError,
    data: places,
    hasNextPage: placesHasNextPage,
  } = useListPlaces(community.communityId);

  return (
    <>
      <SectionTitle icon={<InfoIcon />}>Places</SectionTitle>
      {placesError && <Alert severity="error">{placesError.message}</Alert>}
      {isPlacesLoading && <CircularProgress />}
      <HorizontalScroller className={classes.cardContainer}>
        {places &&
        places.pages.length > 0 &&
        places.pages[0].placesList.length === 0 ? (
          <TextBody>{PLACES_EMPTY_STATE}</TextBody>
        ) : (
          places?.pages
            .flatMap((res) => res.placesList)
            .map((place) => (
              <PlaceCard
                place={place}
                className={classes.placeEventCard}
                key={`placecard-${place.pageId}`}
              />
            ))
        )}
        {placesHasNextPage && (
          <div className={classes.loadMoreButton}>
            <Link
              to={routeToCommunityPlaces(community.communityId, community.slug)}
            >
              <IconButton aria-label={SEE_MORE_PLACES_LABEL}>
                <MoreIcon />
              </IconButton>
            </Link>
          </div>
        )}
      </HorizontalScroller>
    </>
  );
}
