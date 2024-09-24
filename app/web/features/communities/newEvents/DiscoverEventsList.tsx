import { CircularProgress, Typography } from "@material-ui/core";
import Alert from "components/Alert";
import Button from "components/Button";
import TextBody from "components/TextBody";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import makeStyles from "utils/makeStyles";

import { useListAllEvents } from "../events/hooks";
import EventsList from "./EventsList";

const useStyles = makeStyles((theme) => ({
  heading: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
}));

const DiscoverEventsList = ({
  heading,
  eventType,
  isVerticalStyle = false,
}: {
  heading: string;
  eventType: EventsType;
  isVerticalStyle?: boolean;
}) => {
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const classes = useStyles();

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListAllEvents({
      pastEvents: eventType === "past",
      pageSize: 10,
    });
  const flatEvents = data?.pages.flatMap((page) => page.eventsList) || [];
  const hasEvents = flatEvents && flatEvents?.length > 0;

  return (
    <>
      <Typography className={classes.heading} variant="h2">
        {heading}
      </Typography>
      {!hasEvents && <TextBody>{t("communities:events_empty_state")}</TextBody>}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <CircularProgress />
      ) : (
        <EventsList events={flatEvents} isVerticalStyle={isVerticalStyle} />
      )}
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()}>
          {t("communities:see_more_events_label")}
        </Button>
      )}
    </>
  );
};

export default DiscoverEventsList;
