import { Alert, Container, Grid, Typography } from "@mui/material";
import Divider from "components/Divider";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import DashboardBanners from "features/dashboard/DashboardBanners";
import { useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { theme } from "theme";

import dashboardNews from "../../dashboardNews.json";
import CommunitiesSection from "./CommunitiesSection";
import DashboardUserProfileSummary from "./DashboardUserProfileSummary";
import Hero from "./Hero";
import MyEvents from "./MyEvents";

export default function Dashboard() {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);

  return (
    <>
      <Hero />

      {/* this view uses a container, instead of it coming from the route layout,
        because the hero section is full viewport width */}
      <Container maxWidth="lg">
        <Grid container direction="row">
          <Grid item sm={4} xs={12} sx={{ marginTop: theme.spacing(3) }}>
            <DashboardUserProfileSummary />
          </Grid>

          <Grid
            item
            sm={8}
            xs={12}
            sx={{
              [theme.breakpoints.up("sm")]: {
                paddingLeft: theme.spacing(5),
              },
            }}
          >
            <HtmlMeta title={t("global:nav.dashboard")} />

            <PageTitle>{t("dashboard:welcome")}</PageTitle>
            <Alert severity="info">
              <Typography variant="body1">
                <b>New Feature Alert!</b> {dashboardNews["2025-02-23"]}
              </Typography>
            </Alert>

            <Typography variant="h1" component="h2" paragraph>
              {t("dashboard:dashboard")}
            </Typography>

            <DashboardBanners />

            <Divider spacing={3} />

            <MyEvents />

            <Divider spacing={3} />

            <CommunitiesSection />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
