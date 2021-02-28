import React from "react";
import { Link } from "react-router-dom";

import Alert from "../../../components/Alert";
import CircularProgress from "../../../components/CircularProgress";
import HorizontalScroller from "../../../components/HorizontalScroller";
import IconButton from "../../../components/IconButton";
import { InfoIcon, MoreIcon } from "../../../components/Icons";
import TextBody from "../../../components/TextBody";
import { Community } from "../../../pb/communities_pb";
import { routeToCommunityPlaces } from "../../../routes";
import { useListPlaces } from "../useCommunity";
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
        {
          //Is there a better way to check for empty state?
          places &&
          places.pages.length > 0 &&
          places.pages[0].placesList.length === 0 ? (
            <TextBody>No places to show yet.</TextBody>
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
          )
        }
        {placesHasNextPage && (
          <div className={classes.loadMoreButton}>
            <Link
              to={routeToCommunityPlaces(community.communityId, community.slug)}
            >
              <IconButton aria-label="See more places">
                <MoreIcon />
              </IconButton>
            </Link>
          </div>
        )}
      </HorizontalScroller>
    </>
  );
}
