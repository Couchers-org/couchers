import { styled } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import { CalendarIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { Community } from "couchers/proto/communities_pb";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { routeToCommunity, routeToNewEvent } from "routes";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";

import { SectionTitle } from "../CommunityPage";
import { useListCommunityEvents } from "../hooks";
import EventCard from "./EventCard";

const StyledLoadMoreButton = styled("div")(() => ({
  alignSelf: "center",
  display: "flex",
  justifyContent: "center",
  width: "100%",
}));

const StyledSection = styled("div")(() => ({
  display: "grid",
  rowGap: theme.spacing(2),
}));

const StyledCardContainer = styled(HorizontalScroller)(() => ({
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    overflowX: "auto",
    flexWrap: "nowrap",
  },
}));

const StyledEventCard = styled(EventCard)(() => ({
  [theme.breakpoints.up("sm")]: {
    width: "calc(33.333% - 16px)", // 3 cards per row with gap
    maxWidth: "280px",
  },
  [theme.breakpoints.down("sm")]: {
    width: "200px", // Fixed width on mobile
    flexShrink: 0,
  },
}));

const StyledSelfCenteredButton = styled(Button)(() => ({
  justifySelf: "center",
}));

export default function EventsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const router = useRouter();

  const { data, error, hasNextPage, isLoading } = useListCommunityEvents({
    communityId: community.communityId,
    pageSize: 3,
    type: "summary",
  });

  return (
    <StyledSection>
      <SectionTitle icon={<CalendarIcon />} variant="h2">
        {t("communities:events_title")}
      </SectionTitle>

      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <StyledCardContainer>
            {data.pages
              .flatMap((page) => page.eventsList)
              .filter((event) => !event.isCancelled)
              .map((event) => (
                <StyledEventCard key={event.eventId} event={event} />
              ))}
          </StyledCardContainer>
          {hasNextPage && (
            <StyledLoadMoreButton>
              <StyledLink
                href={routeToCommunity(
                  community.communityId,
                  community.slug,
                  "events",
                )}
              >
                {t("global:nav.show_all_events")}
              </StyledLink>
            </StyledLoadMoreButton>
          )}
        </>
      ) : (
        !error && (
          <TextBody>
            <Trans
              t={t}
              i18nKey="communities:events_empty_state"
              components={[
                <StyledLink key="create-link" href={routeToNewEvent()} />,
              ]}
            />
          </TextBody>
        )
      )}
      <StyledSelfCenteredButton
        onClick={() => router.push(routeToNewEvent(community.communityId))}
      >
        {t("communities:create_an_event")}
      </StyledSelfCenteredButton>
    </StyledSection>
  );
}
