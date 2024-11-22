import { CircularProgress, Pagination, Typography } from "@mui/material";
import Alert from "components/Alert";
import TextBody from "components/TextBody";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useState } from "react";
import makeStyles from "utils/makeStyles";

import EventsList from "./EventsList";
import { useListMyEvents } from "./hooks";

const useStyles = makeStyles((theme) => ({
  emptyState: {
    marginBottom: theme.spacing(2),
  },
  filter: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.text.primary,
    padding: theme.spacing(1, 2),
    textAlign: "center",
    fontWeight: "bold",
    margin: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius * 6,
    "&:hover": {
      cursor: "pointer",
    },
  },
  filterTags: {
    display: "flex",
    alignItems: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  loadingBox: {
    display: "flex",
    justifyContent: "center",
    padding: theme.spacing(2),
    width: "100%",
    minHeight: theme.spacing(20),
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  selectedFilter: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.common.white,
    padding: theme.spacing(1, 2),
    textAlign: "center",
    fontWeight: "bold",
    margin: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius * 6,
    "&:hover": {
      cursor: "pointer",
    },
  },
}));

const MyEventsList = () => {
  const classes = useStyles();
  const { t } = useTranslation([COMMUNITIES]);
  const pageSize = 5;

  const [pageNumber, setPageNumber] = useState(1);
  const [eventType, setEventType] = useState<EventsType>("upcoming");
  const [showCancelled, setShowCancelled] = useState<boolean>(false);

  const { data, error, isLoading } = useListMyEvents({
    pastEvents: eventType === "past",
    pageSize,
    pageNumber,
    showCancelled,
  });

  const hasEvents = data && data.eventsList && data.eventsList.length > 0;
  const numPages = Math.ceil((data?.totalItems ?? 0) / pageSize) ?? 1;

  const handlePageNumberChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPageNumber(value);
  };

  const handleFilterPastClick = () => {
    if (eventType === "upcoming") {
      setEventType("past");
    } else {
      setEventType("upcoming");
    }
    setPageNumber(1);
  };

  const handleFilterShowCancelledClick = () => {
    setShowCancelled(!showCancelled);
    setPageNumber(1);
  };

  return (
    <>
      <div className={classes.filterTags}>
        <Typography
          className={
            eventType === "past" ? classes.selectedFilter : classes.filter
          }
          variant="body2"
          onClick={handleFilterPastClick}
        >
          {t("communities:past")}
        </Typography>
        <Typography
          className={showCancelled ? classes.selectedFilter : classes.filter}
          variant="body2"
          onClick={handleFilterShowCancelledClick}
        >
          {t("communities:show_cancelled_events")}
        </Typography>
      </div>
      {!hasEvents && !isLoading && (
        <TextBody className={classes.emptyState}>
          {t("communities:events_empty_state")}
        </TextBody>
      )}
      {error && <Alert severity="error">{error.message}</Alert>}
      {isLoading && (
        <div className={classes.loadingBox}>
          <CircularProgress />
        </div>
      )}
      {hasEvents && !isLoading && (
        <>
          <EventsList events={data.eventsList} />
          <Pagination
            className={classes.pagination}
            count={numPages}
            page={pageNumber}
            color="primary"
            onChange={handlePageNumberChange}
            size="large"
          />
        </>
      )}
    </>
  );
};

export default MyEventsList;
