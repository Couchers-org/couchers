import { Typography } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import { EventsType } from "queryKeys";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EVENTS } from "../../../constants";
import { allEventsPageTabLabels } from "./constants";
import EventsTab from "./EventsTab";

export default function EventsPage() {
  const { t } = useTranslation(["communities"]);
  const [tab, setTab] = useState<EventsType>("upcoming");

  return (
    <>
      <HtmlMeta title={EVENTS} />
      <PageTitle>{t("communities:discover_events_title")}</PageTitle>
      <Typography variant="body1">
        {t("communities:discover_events_subtitle")}
      </Typography>
      <TabContext value={tab}>
        <TabBar
          ariaLabel={t("communities:all_events_page_tabs_a11y_label")}
          setValue={setTab}
          labels={allEventsPageTabLabels}
        />
        <TabPanel value="upcoming">
          <EventsTab tabTitle={t("communities:upcoming")} />
        </TabPanel>
        <TabPanel value="past">
          <EventsTab pastEvents tabTitle={t("communities:past")} />
        </TabPanel>
      </TabContext>
    </>
  );
}
