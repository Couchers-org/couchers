import { Button } from "@material-ui/core";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import PageTitle from "components/PageTitle";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { MouseEvent, useState } from "react";
import { newEventRoute } from "routes";
import makeStyles from "utils/makeStyles";

import DiscoverEventsList from "./DiscoverEventsList";
import MyEventsList from "./MyEventsList";

const useStyles = makeStyles((theme) => ({
  button: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    margin: theme.spacing(2),
    padding: theme.spacing(1, 2),
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
    fontWeight: "bold",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    paddingBottom: theme.spacing(),
  },
  toggleButtonGroup: {
    backgroundColor: theme.palette.grey[300],
    border: "1px solid " + theme.palette.grey[300],
    borderRadius: "15px",
    marginBottom: theme.spacing(2),
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
      border: "1px solid " + theme.palette.grey[50],
      borderRadius: "15px",
    },
  },
  toggleButton: {
    fontWeight: "bold",
    border: "none",
    "&.Mui-selected": {
      backgroundColor: theme.palette.common.white,
      color: theme.palette.text.primary,
      boxShadow: theme.shadows[0],
      border: "1px solid " + theme.palette.grey[300],
      borderRadius: "15px",
    },
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
      border: "1px solid " + theme.palette.grey[50],
      borderRadius: "15px",
    },
  },
}));

const EventsPage = () => {
  const classes = useStyles();
  const router = useRouter();
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const [eventType, setEventType] = useState<EventsType>("upcoming");

  const handleToggleClick = (
    event: MouseEvent<HTMLElement>,
    newAlignment: "past" | "upcoming"
  ) => {
    if (newAlignment !== null && newAlignment !== eventType) {
      setEventType(newAlignment);
    }
  };

  return (
    <div>
      <div className={classes.headerRow}>
        <PageTitle>{t("communities:events_title")}</PageTitle>
        <Button
          className={classes.button}
          size="small"
          onClick={() => router.push(newEventRoute)}
        >
          {t("communities:create_new_event")}
        </Button>
      </div>
      <ToggleButtonGroup
        className={classes.toggleButtonGroup}
        exclusive
        onChange={handleToggleClick}
        aria-label="Event Type"
        value={eventType}
        style={{ width: "100%" }}
        size="small"
      >
        <ToggleButton
          aria-label="upcoming"
          value="upcoming"
          style={{ flexGrow: 1 }}
          className={classes.toggleButton}
        >
          {t("communities:upcoming")}
        </ToggleButton>
        <ToggleButton
          aria-label="past"
          value="past"
          style={{ flexGrow: 1 }}
          className={classes.toggleButton}
        >
          {t("communities:past")}
        </ToggleButton>
      </ToggleButtonGroup>
      <MyEventsList
        eventType={eventType}
        heading={
          eventType === "upcoming"
            ? t("communities:your_upcoming_events")
            : t("communities:your_past_events")
        }
        showCancelled={true}
      />
      <DiscoverEventsList
        eventType={eventType}
        heading={t("communities:discover_events_title")}
        isVerticalStyle
      />
    </div>
  );
};

export default EventsPage;
