import { Button } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES, GLOBAL } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useState } from "react";
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
}));

const EventsPage = () => {
  const classes = useStyles();
  const router = useRouter();
  const { t } = useTranslation([GLOBAL, COMMUNITIES]);
  const [eventType, setEventType] = useState<EventsType>("upcoming");

  const allEventsPageTabLabels: Record<EventsType, string> = {
    upcoming: t("communities:upcoming"),
    past: t("communities:past"),
  };

  const handleToggleClick = (value: EventsType) => {
    if (value !== null && value !== eventType) {
      setEventType(value);
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
      <TabContext value={eventType}>
        <TabBar
          ariaLabel={t("communities:all_events_page_tabs_a11y_label")}
          setValue={handleToggleClick}
          labels={allEventsPageTabLabels}
        />
        <TabPanel value="upcoming">
          <MyEventsList eventType={eventType} showCancelled={true} />
        </TabPanel>
        <TabPanel value="past">
          <MyEventsList eventType={eventType} showCancelled={true} />
        </TabPanel>
      </TabContext>
      <DiscoverEventsList
        eventType="upcoming" // @TODO - Is there any use case for discover showing past events?
        heading={t("communities:discover_events_title")}
        isVerticalStyle
      />
    </div>
  );
};

export default EventsPage;
