import Alert from "components/Alert";
import Button from "components/Button";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HorizontalScroller from "components/HorizontalScroller";
import { CalendarIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Community } from "proto/communities_pb";
import { routeToCommunity, routeToNewEvent } from "routes";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { SectionTitle, useCommunityPageStyles } from "../CommunityPage";
import { useListCommunityEvents } from "../hooks";
import EventCard from "./EventCard";

const useStyles = makeStyles((theme) => ({
  section: {
    display: "grid",
    rowGap: theme.spacing(2),
  },
  centerSelf: {
    justifySelf: "center",
  },
  cardContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      overflowX: "auto",
      flexWrap: "nowrap",
    },
  },
  placeEventCard: {
    [theme.breakpoints.up("sm")]: {
      width: "calc(33.333% - 16px)", // 3 cards per row with gap
      maxWidth: "280px",
    },
    [theme.breakpoints.down("sm")]: {
      width: "200px", // Fixed width on mobile
      flexShrink: 0,
    },
  },
}));

export default function EventsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const classes = { ...useCommunityPageStyles(), ...useStyles() };
  const router = useRouter();

  const { data, error, hasNextPage, isLoading } = useListCommunityEvents({
    communityId: community.communityId,
    pageSize: 3,
    type: "summary",
  });

  return (
    <section className={classes.section}>
      <SectionTitle icon={<CalendarIcon />} variant="h2">
        {t("communities:events_title")}
      </SectionTitle>

      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CenteredSpinner />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <HorizontalScroller className={classes.cardContainer}>
            {data.pages
              .flatMap((page) => page.eventsList)
              .filter((event) => !event.isCancelled)
              .map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  className={classes.placeEventCard}
                />
              ))}
          </HorizontalScroller>
          {hasNextPage && (
            <div className={classes.loadMoreButton}>
              <StyledLink
                href={routeToCommunity(
                  community.communityId,
                  community.slug,
                  "events",
                )}
              >
                {t("global:nav.show_all_events")}
              </StyledLink>
            </div>
          )}
        </>
      ) : (
        !error && <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
      <Button
        className={classes.centerSelf}
        onClick={() => router.push(routeToNewEvent(community.communityId))}
      >
        {t("communities:create_an_event")}
      </Button>
    </section>
  );
}
