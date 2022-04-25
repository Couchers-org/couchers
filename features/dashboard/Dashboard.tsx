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
import CommunitiesDialog from "features/dashboard/CommunitiesDialog";
import CommunitiesList from "features/dashboard/CommunitiesList";
import DashboardBanners from "features/dashboard/DashboardBanners";
import { ProfileUserProvider } from "features/profile/hooks/useProfileUser";
import Overview from "features/profile/view/Overview";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { useState } from "react";

import AccordionContribute from "./AccordionContribute";
import AccordionFeatureUpdates from "./AccordionFeatureUpdates";
import AccordionOutreach from "./AccordionOutreach";
import { COMMUNITY_BUILDER_FORM_LINK } from "./constants";
import MyEvents from "./MyEvents";

const useStyles = makeStyles((theme) => ({
  communityText2: {
    paddingBlockStart: theme.spacing(2),
    paddingBlockEnd: theme.spacing(1),
  },
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
  const [isCommunitiesDialogOpen, setIsCommunitiesDialogOpen] = useState(false);
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
            {t("dashboard:landing_text")}
          </Typography>

          <Typography variant="h1" component="h2" paragraph>
            Dashboard
          </Typography>

          <DashboardBanners />

          <Divider spacing={3} />

          <MyEvents />

          <Divider spacing={3} />

          <Typography variant="h2" gutterBottom>
            {t("dashboard:your_communities_heading")}
          </Typography>
          <Typography variant="body1" paragraph>
            <Trans i18nKey="dashboard:your_communities_helper_text">
              {`You have been added to all communities based on your location. Feel free to `}
              <MuiLink
                component="button"
                style={{ verticalAlign: "baseline" }}
                onClick={() => {
                  setIsCommunitiesDialogOpen(true);
                }}
              >
                {/* @todo: revisit this UI. A button that opens a popup shouldn't look like a link */}
                browse communities
              </MuiLink>
              {` in other locations as well.`}
            </Trans>
          </Typography>

          <CommunitiesList />

          <CommunitiesDialog
            isOpen={isCommunitiesDialogOpen}
            onClose={() => setIsCommunitiesDialogOpen(false)}
          />

          <Typography
            variant="body1"
            gutterBottom
            className={classes.communityText2}
          >
            <Trans i18nKey="dashboard:your_communities_helper_text2">
              {`Don't see your community? `}
              <MuiLink
                href={COMMUNITY_BUILDER_FORM_LINK}
                target="_blank"
                rel="noreferrer noopener"
              >
                Get it started!
              </MuiLink>
            </Trans>
          </Typography>

          <Divider spacing={3} />

          <AccordionFeatureUpdates />

          <AccordionOutreach />

          <AccordionContribute />
        </Grid>
      </Grid>
    </Container>
  );
}
