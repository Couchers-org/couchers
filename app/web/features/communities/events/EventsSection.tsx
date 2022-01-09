import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import HorizontalScroller from "components/HorizontalScroller";
import { CalendarIcon } from "components/Icons";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
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
}));

export default function EventsSection({
  community,
}: {
  community: Community.AsObject;
}) {
  const { t } = useTranslation(["communities"]);
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
        <CircularProgress />
      ) : hasAtLeastOnePage(data, "eventsList") ? (
        <>
          <HorizontalScroller className={classes.cardContainer}>
            {data.pages
              .flatMap((page) => page.eventsList)
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
                  "events"
                )}
              >
                {t("communities:show_all_events")}
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
