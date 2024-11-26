import { CircularProgress } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import { CalendarIcon } from "components/Icons";
import TextBody from "components/TextBody";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useRouter } from "next/router";
import { Community } from "proto/communities_pb";
import { routeToNewEvent } from "routes";
import { theme } from "theme";
import hasAtLeastOnePage from "utils/hasAtLeastOnePage";
import makeStyles from "utils/makeStyles";

import { SectionTitle, useCommunityPageStyles } from "../CommunityPage";
import { useListCommunityEvents } from "../hooks";
import CommunityLongEventCard from "./CommunityLongEventCard";

interface CommunityEventsListProps {
  community: Community.AsObject;
}

const useStyles = makeStyles((theme) => ({
  eventsListContainer: {
    display: "grid",
    rowGap: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      //break out of page padding
      left: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      position: "relative",
      right: "50%",
      width: "100vw",
    },
    marginBlockEnd: theme.spacing(2),
  },
}));

export default function CommunityEventsList({
  community,
}: CommunityEventsListProps) {
  const { t } = useTranslation([COMMUNITIES]);
  const classes = { ...useCommunityPageStyles(), ...useStyles() };
  const router = useRouter();

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListCommunityEvents({
      communityId: community.communityId,
      pageSize: 5,
      type: "all",
    });

  return (
    <>
      <SectionTitle icon={<CalendarIcon />}>
        {t("communities:events_title")}
      </SectionTitle>
      <Button
        className={classes.createResourceButton}
        onClick={() => router.push(routeToNewEvent(community.communityId))}
      >
        {t("communities:create_an_event")}
      </Button>
      {error && <Alert severity="error">{error.message}</Alert>}
      <div className={classes.eventsListContainer}>
        {isLoading ? (
          <CircularProgress />
        ) : hasAtLeastOnePage(data, "eventsList") ? (
          data.pages
            .flatMap((page) => page.eventsList)
            .filter((event) => !event.isCancelled)
            .map((event) => (
              <CommunityLongEventCard event={event} key={event.eventId} />
            ))
        ) : (
          !error && <TextBody>{t("communities:events_empty_state")}</TextBody>
        )}
      </div>
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          sx={{
            color: theme.palette.common.black,
            borderColor: theme.palette.grey[300],

            "&:hover": {
              borderColor: theme.palette.grey[300],
              backgroundColor: "#3135390A",
            },
          }}
        >
          {t("communities:see_more_events_label")}
        </Button>
      )}
    </>
  );
}
