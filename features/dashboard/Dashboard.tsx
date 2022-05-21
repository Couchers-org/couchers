import { Container, Grid, makeStyles, Typography } from "@material-ui/core";
import Divider from "components/Divider";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import StyledLink from "components/StyledLink";
import DashboardBanners from "features/dashboard/DashboardBanners";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { blogRoute, donationsRoute } from "routes";

import CommunitiesSection from "./CommunitiesSection";
import DashboardUserProfileSummary from "./DashboardUserProfileSummary";
import Hero from "./Hero";
import MyEvents from "./MyEvents";

const useStyles = makeStyles((theme) => ({
  profileOverviewContainer: {
    marginTop: theme.spacing(3),
  },
  mainContentContainer: {
    [theme.breakpoints.up("sm")]: {
      paddingLeft: theme.spacing(5),
    },
  },
}));

export default function Dashboard() {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);
  const classes = useStyles();

  return (
    <>
      <Hero />

      {/* this view uses a container, instead of it coming from the route layout,
        because the hero section is full viewport width */}
      <Container maxWidth="lg">
        <Grid container direction="row">
          <Grid
            item
            sm={4}
            xs={12}
            className={classes.profileOverviewContainer}
          >
            <DashboardUserProfileSummary />
          </Grid>

          <Grid item sm={8} xs={12} className={classes.mainContentContainer}>
            <HtmlMeta title={t("global:nav.dashboard")} />

            <PageTitle>{t("dashboard:welcome")}</PageTitle>
            <Typography variant="body1" paragraph>
              <Trans i18nKey="dashboard:landing_text">
                {`We are building new `}
                <StyledLink href={blogRoute}>features</StyledLink>
                {` like events, local guides, moderation and hangouts. We appreciate your patience and `}
                <StyledLink href={donationsRoute}>support</StyledLink>
                {` as we develop these.`}
              </Trans>
            </Typography>

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
