import { CircularProgress } from "@material-ui/core";
import Alert from "components/Alert";
import TextBody from "components/TextBody";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useMemo } from "react";
import makeStyles from "utils/makeStyles";

import { useListMyEvents } from "../events/hooks";
import EventsList from "./EventsList";

const useStyles = makeStyles((theme) => ({
  loadingBox: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(2),
    width: "100%",
  },
}));

const MyEventsList = ({
  eventType,
  showCancelled,
}: {
  eventType: EventsType;
  showCancelled: boolean;
}) => {
  const classes = useStyles();
  const { t } = useTranslation([COMMUNITIES]);

  const { data, error, hasNextPage, fetchNextPage, isLoading } =
    useListMyEvents({
      pastEvents: eventType === "past",
      pageSize: 5,
      showCancelled,
    });

  const flatEvents = useMemo(
    () => data?.pages.flatMap((page) => page.eventsList) || [],
    [data]
  );
  const hasEvents = flatEvents?.length > 0;

  return (
    <>
      {!hasEvents && !isLoading && (
        <TextBody>{t("communities:events_empty_state")}</TextBody>
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading ? (
        <div className={classes.loadingBox}>
          <CircularProgress />
        </div>
      ) : (
        <EventsList
          events={flatEvents}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
        />
      )}
    </>
  );
};

export default MyEventsList;
