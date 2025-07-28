import { TabContext, TabPanel } from "@mui/lab";
import { styled } from "@mui/material";
import { Button, Card, Grid, Link } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import { useRouter } from "next/router";
import React from "react";
import { useTranslation } from "react-i18next";
import { EditUserTab, routeToEditProfile, settingsRoute } from "routes";

import EditHostingPreference from "./EditHostingPreference";
import EditProfile from "./EditProfile";

const DetailsCard = styled(Card)(({ theme }) => ({
  flexGrow: 1,
  marginRight: 0,
  padding: theme.spacing(2),
  [theme.breakpoints.down("md")]: {
    margin: 0,
    width: "100%",
  },
}));

const ButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  paddingBottom: theme.spacing(1),
  paddingTop: theme.spacing(1),
}));

const LinkStyle = styled("a")(({ theme }) => ({
  color: "inherit",
  fontSize: "1rem",
  textDecoration: "none",
  "&:hover": {
    textDecoration: "underline",
  },
}));

const Root = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    paddingTop: 0,
    display: "flex",
  },
}));

const StyledTabPanel = styled(TabPanel)({
  padding: 0,
});

export default function EditProfilePage({
  tab = "about",
}: {
  tab?: EditUserTab;
}) {
  const { t } = useTranslation();
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

        <ButtonContainer>
          <Link href={settingsRoute} passHref legacyBehavior>
            <Button component={LinkStyle} variant="contained" color="primary">
              {t("global:nav.account_settings")}
            </Button>
          </Link>
        </ButtonContainer>
      </Grid>
      <Root>
        <DetailsCard>
          <TabContext value={tab}>
            <TabBar
              setValue={(newTab) => router.push(routeToEditProfile(newTab))}
              labels={{
                about: t("profile:heading.about_me"),
                home: t("profile:heading.home"),
              }}
              ariaLabel={t("profile:edit_profile_tab_bar_a11y_label")}
            />
            <StyledTabPanel value="about">
              <EditProfile />
            </StyledTabPanel>
            <StyledTabPanel value="home">
              <EditHostingPreference />
            </StyledTabPanel>
          </TabContext>
        </DetailsCard>
      </Root>
    </>
  );
}
