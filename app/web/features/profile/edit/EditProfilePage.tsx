import { Button, Card, Grid } from "@material-ui/core";
import { TabContext, TabPanel } from "@material-ui/lab";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { EditUserTab, routeToEditProfile, settingsRoute } from "routes";
import { t } from "test/utils";
import makeStyles from "utils/makeStyles";

import EditHostingPreference from "./EditHostingPreference";
import EditProfile from "./EditProfile";

const useStyles = makeStyles((theme) => ({
  detailsCard: {
    [theme.breakpoints.down("sm")]: {
      margin: 0,
      width: "100%",
    },
    flexGrow: 1,
    marginRight: 0,
    padding: theme.spacing(2),
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    paddingBottom: theme.spacing(1),
    paddingTop: theme.spacing(1),
  },
  linkStyle: {
    "&:hover": {
      textDecoration: "underline",
    },
    color: "inherit",
    fontSize: "1rem",
    textDecoration: "none",
  },
  root: {
    paddingTop: theme.spacing(3),
    [theme.breakpoints.up("md")]: {
      paddingTop: 0,
      display: "flex",
    },
  },
  tabPanel: {
    padding: 0,
  },
}));

export default function EditProfilePage({
  tab = "about",
}: {
  tab?: EditUserTab;
}) {
  const classes = useStyles();
  const router = useRouter();

  return (
    <>
      <HtmlMeta title={t("profile:heading.edit_profile")} />
      <Grid
        container
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <PageTitle>{t("profile:heading.edit_profile")}</PageTitle>
        <div className={classes.buttonContainer}>
          <Link href={settingsRoute} passHref>
            <Button component="a" variant="contained" color="primary">
              {t("global:nav.account_settings")}
            </Button>
          </Link>
        </div>
      </Grid>
      <div className={classes.root}>
        <Card className={classes.detailsCard}>
          <TabContext value={tab}>
            <TabBar
              setValue={(newTab) => router.push(routeToEditProfile(newTab))}
              labels={{
                about: t("profile:heading.about_me"),
                home: t("profile:heading.home"),
              }}
              ariaLabel={t("profile:edit_profile_tab_bar_a11y_label")}
            />
            <TabPanel classes={{ root: classes.tabPanel }} value="about">
              <EditProfile />
            </TabPanel>
            <TabPanel value="home">
              <EditHostingPreference />
            </TabPanel>
          </TabContext>
        </Card>
      </div>
    </>
  );
}
