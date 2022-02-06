import { Typography } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import { EVENTS } from "appConstants";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import { EventsType } from "features/queryKeys";
import { useTranslation } from "i18n";
import { COMMUNITIES } from "i18n/namespaces";
import { useState } from "react";

import EventsTab from "./EventsTab";

export default function EventsPage() {
  const { t } = useTranslation([COMMUNITIES]);
  const [tab, setTab] = useState<EventsType>("upcoming");

  const allEventsPageTabLabels: Record<EventsType, string> = {
    upcoming: t("communities:upcoming"),
    past: t("communities:past"),
  };

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
