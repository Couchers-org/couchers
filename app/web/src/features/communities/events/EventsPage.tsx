import { Typography } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import { EventsType } from "queryKeys";
import { useState } from "react";

import { EVENTS } from "../../../constants";
import {
  ALL_EVENTS_PAGE_TABS_A11Y_LABEL,
  allEventsPageTabLabels,
  DISCOVER_EVENTS_SUBTITLE,
  DISCOVER_EVENTS_TITLE,
  PAST,
  UPCOMING,
} from "./constants";
import EventsTab from "./EventsTab";

export default function EventsPage() {
  const [tab, setTab] = useState<EventsType>("upcoming");

  return (
    <>
      <HtmlMeta title={EVENTS} />
      <PageTitle>{DISCOVER_EVENTS_TITLE}</PageTitle>
      <Typography variant="body1">{DISCOVER_EVENTS_SUBTITLE}</Typography>
      <TabContext value={tab}>
        <TabBar
          ariaLabel={ALL_EVENTS_PAGE_TABS_A11Y_LABEL}
          setValue={setTab}
          labels={allEventsPageTabLabels}
        />
        <TabPanel value="upcoming">
          <EventsTab tabTitle={UPCOMING} />
        </TabPanel>
        <TabPanel value="past">
          <EventsTab pastEvents tabTitle={PAST} />
        </TabPanel>
      </TabContext>
    </>
  );
}
