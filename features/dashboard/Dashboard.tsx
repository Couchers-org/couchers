import {
  CircularProgress,
  Container,
  Grid,
  Hidden,
  Link as MuiLink,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import Divider from "components/Divider";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import DashboardBanners from "features/dashboard/DashboardBanners";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import Overview from "features/profile/view/Overview";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { blogRoute } from "routes";

import CommunitiesSection from "./CommunitiesSection";
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
  const { data: user, error, isLoading } = useCurrentUser();

  return (
    <Container maxWidth="md">
      <Grid container direction="row" spacing={0}>
        <Hidden xsDown>
          <Grid
            item
            sm={4}
            xs={12}
            className={classes.profileOverviewContainer}
          >
            {error && <Alert severity="error">{error}</Alert>}
            {isLoading ? (
              <CircularProgress />
            ) : user ? (
              <ProfileUserProvider user={user}>
                <Overview setIsRequesting={() => {}} tab={undefined} />
              </ProfileUserProvider>
            ) : undefined}
          </Grid>
        </Hidden>

        <Grid item sm={8} xs={12} className={classes.mainContentContainer}>
          <HtmlMeta title={t("global:nav.dashboard")} />

          <PageTitle>{t("dashboard:welcome")}</PageTitle>
          <Typography variant="body1" paragraph>
            <Trans i18nKey="dashboard:landing_text">
              {`We are building new `}
              <MuiLink
                href={blogRoute}
                target="_blank"
                rel="noreferrer noopener"
              >
                features
              </MuiLink>
              {` like events, local guides, moderation and hangouts. We appreciate your patience and support as we develop these.`}
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
  );
}
