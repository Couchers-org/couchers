import { Alert, Box, Grid, Typography } from "@mui/material";
import Divider from "components/Divider";
import HtmlMeta from "components/HtmlMeta";
import PageContainer from "components/PageContainer";
import PageTitle from "components/PageTitle";
import StyledLink from "components/StyledLink";
import { useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { theme } from "theme";

import dashboardNews from "../../dashboardNews.json";
import CommunitiesSection from "./CommunitiesSection";
import CommunityEvents from "./CommunityEvents";
import DashboardUserProfileSummary from "./DashboardUserProfileSummary";
import Hero from "./Hero";
import MyCommunitiesDiscussions from "./MyCommunitiesDiscussions";
import MyEvents from "./MyEvents";
import ReminderCarousel from "./ReminderCarousel";
import UpcomingStays from "./UpcomingStays";

export default function Dashboard() {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);

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

            <Alert
              severity="info"
              sx={{
                marginBottom: theme.spacing(2),
                [theme.breakpoints.down("sm")]: { py: 0.75 },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  [theme.breakpoints.down("sm")]: { fontSize: "0.8125rem" },
                }}
              >
                New blog post:{" "}
                <StyledLink href={dashboardNews["2026-05-25"].link}>
                  {dashboardNews["2026-05-25"].title}
                </StyledLink>
              </Typography>
            </Alert>

            <Alert
              severity="info"
              sx={{
                marginBottom: theme.spacing(2),
                [theme.breakpoints.down("sm")]: { py: 0.75 },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  [theme.breakpoints.down("sm")]: { fontSize: "0.8125rem" },
                }}
              >
                New blog post:{" "}
                <StyledLink href={dashboardNews["2026-05-15"].link}>
                  {dashboardNews["2026-05-15"].title}
                </StyledLink>
              </Typography>
            </Alert>

            <ReminderCarousel />

            <Divider spacing={3} />

            <UpcomingStays />

            <Box sx={{ height: theme.spacing(3) }} />

            <MyEvents />

            <Box sx={{ height: theme.spacing(3) }} />

            <CommunityEvents />

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
