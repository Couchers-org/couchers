import { styled } from "@mui/material";
import Alert from "components/Alert";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import { LocationIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { useListPlaces } from "features/communities/hooks";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { Community } from "proto/communities_pb";
import React from "react";
import { theme } from "theme";

import PlaceCard from "./PlaceCard";
import TitleWithIcon from "./TitleWithIcon";

const StyledCardContainer = styled(HorizontalScroller)(() => ({
  [theme.breakpoints.down("sm")]: {
    left: "50%",
    marginLeft: "-50vw",
    marginRight: "-50vw",
    position: "relative",
    right: "50%",
    width: "100vw",
  },
  [theme.breakpoints.up("sm")]: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: theme.spacing(2),
  },
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing(3),
  },
}));

const StyledPlaceCard = styled(PlaceCard)(() => ({
  [theme.breakpoints.up("sm")]: {
    width: "100%",
  },
  [theme.breakpoints.down("sm")]: {
    margin: theme.spacing(0, 2, 1, 0),
  },
  width: "50%",
  flexShrink: 0,
  borderRadius: theme.shape.borderRadius * 2,
  scrollSnapAlign: "start",
}));

export default function PlacesSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([COMMUNITIES]);

  const {
    isLoading: isPlacesLoading,
    error: placesError,
    data: places,
  } = useListPlaces(community.communityId);

  return (
    <>
      <TitleWithIcon icon={<LocationIcon />}>
        {t("communities:places_title")}
      </TitleWithIcon>
      {placesError && <Alert severity="error">{placesError.message}</Alert>}
      {isPlacesLoading && <CenteredSpinner />}
      <StyledCardContainer>
        {places &&
        places.pages.length > 0 &&
        places.pages[0].placesList.length === 0 ? (
          <TextBody>{t("communities:places_empty_state")}</TextBody>
        ) : (
          places?.pages
            .flatMap((res) => res.placesList)
            .map((place) => (
              <StyledPlaceCard
                place={place}
                key={`placecard-${place.pageId}`}
              />
            ))
        )}
      </StyledCardContainer>
    </>
  );
}
