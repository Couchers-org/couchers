import { useFeatureValue } from "@growthbook/growthbook-react";
import { Grid } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageContainer from "components/PageContainer";
import CommunitiesList from "features/dashboard/CommunitiesList";
import { useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { theme } from "theme";

import CommunityEvents from "./CommunityEvents";
import DashboardCommunityPublicTrips from "./DashboardCommunityPublicTrips";
import DashboardMyPublicTrips from "./DashboardMyPublicTrips";
import DashboardUserProfileSummary from "./DashboardUserProfileSummary";
import Hero from "./Hero";
import MyCommunitiesDiscussions from "./MyCommunitiesDiscussions";
import MyEvents from "./MyEvents";
import ReminderCarousel from "./ReminderCarousel";
import UpcomingStays from "./UpcomingStays";

export default function Dashboard() {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);
  const isPublicTripsEnabled = useFeatureValue("public_trips_enabled", false);

  return (
    <>
      <Hero />
      {/* this view uses a container, instead of it coming from the route layout,
        because the hero section is full viewport width */}
      <PageContainer>
        <Grid container direction="row">
          <Grid size={{ sm: 4, xs: 12 }} sx={{ marginTop: theme.spacing(3) }}>
            <DashboardUserProfileSummary />
          </Grid>

          <Grid
            size={{ sm: 8, xs: 12 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing(3),
              marginTop: theme.spacing(3),
              [theme.breakpoints.up("sm")]: {
                paddingLeft: theme.spacing(5),
              },
            }}
          >
            <HtmlMeta title={t("global:nav.dashboard")} />

            <ReminderCarousel />

            <UpcomingStays />

            {isPublicTripsEnabled && (
              <>
                <DashboardMyPublicTrips />
                <DashboardCommunityPublicTrips />
              </>
            )}

            <MyEvents />

            <CommunityEvents />

            <MyCommunitiesDiscussions />

            <CommunitiesList />
          </Grid>
        </Grid>
      </PageContainer>
    </>
  );
}
