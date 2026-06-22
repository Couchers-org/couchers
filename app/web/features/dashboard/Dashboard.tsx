import { useFeatureValue } from "@growthbook/growthbook-react";
import { Box, Grid } from "@mui/material";
import Divider from "components/Divider";
import HtmlMeta from "components/HtmlMeta";
import PageContainer from "components/PageContainer";
import PageTitle from "components/PageTitle";
import { useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { theme } from "theme";

import CommunitiesSection from "./CommunitiesSection";
import CommunityEvents from "./CommunityEvents";
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
              [theme.breakpoints.up("sm")]: {
                paddingLeft: theme.spacing(5),
              },
            }}
          >
            <HtmlMeta title={t("global:nav.dashboard")} />

            <PageTitle>{t("dashboard:welcome")}</PageTitle>

            <ReminderCarousel />

            <Divider spacing={3} />

            <UpcomingStays />

            <Box sx={{ height: theme.spacing(3) }} />

            <MyEvents />

            <Box sx={{ height: theme.spacing(3) }} />

            <CommunityEvents />

            {isPublicTripsEnabled && (
              <>
                <Box sx={{ height: theme.spacing(3) }} />
                <DashboardMyPublicTrips />
              </>
            )}

            <Box sx={{ height: theme.spacing(3) }} />

            <MyCommunitiesDiscussions />

            <Box sx={{ height: theme.spacing(3) }} />

            <CommunitiesSection />
          </Grid>
        </Grid>
      </PageContainer>
    </>
  );
}
