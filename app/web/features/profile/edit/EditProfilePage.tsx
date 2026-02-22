import { TabContext, TabPanel } from "@mui/lab";
import { Box, Button, Card, styled } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import IconButton from "components/IconButton";
import { BackIcon, CouchIcon, PersonIcon } from "components/Icons";
import PageTitle from "components/PageTitle";
import TabBar from "components/TabBar";
import { useTranslation } from "i18n";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import {
  EditUserTab,
  routeToEditProfile,
  routeToProfile,
  settingsRoute,
} from "routes";
import { theme } from "theme";

import EditHostingPreference from "./EditHostingPreference";
import EditProfile from "./EditProfile";

const DetailsCard = styled(Card)(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    margin: 0,
    width: "100%",
  },
  flexGrow: 1,
  marginRight: 0,
  padding: 0,
  boxShadow: "none",
  border: "none",
  backgroundColor: "transparent",
  backgroundImage: "none",
}));

const Root = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    paddingTop: 0,
    display: "flex",
  },
}));

const TabPanelStyled = styled(TabPanel)(({ theme }) => ({
  padding: 0,
}));

const HeaderContainer = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(3),
}));

const LeftHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const BackButton = styled(IconButton)(({ theme }) => ({
  minWidth: "auto",
  padding: theme.spacing(1),
  borderRadius: "50%",
  color: "var(--mui-palette-text-secondary)",
  "&:hover": {
    backgroundColor: "var(--mui-palette-action-hover)",
    color: "var(--mui-palette-text-primary)",
  },
}));

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
      <HeaderContainer>
        <LeftHeader>
          <BackButton
            onClick={() => router.push(routeToProfile())}
            aria-label={t("global:back")}
          >
            <BackIcon />
          </BackButton>
          <PageTitle>{t("profile:heading.edit_profile")}</PageTitle>
        </LeftHeader>
        <Button
          component={Link}
          variant="contained"
          color="primary"
          href={settingsRoute}
        >
          {t("global:nav.account_settings")}
        </Button>
      </HeaderContainer>
      <Root>
        <DetailsCard>
          <TabContext value={tab}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 1,
              }}
            >
              <Button
                type="submit"
                form={
                  tab === "about" ? "edit-profile-form" : "edit-hosting-form"
                }
                variant="contained"
                color="primary"
                sx={{
                  borderRadius: 22,
                  fontWeight: 600,
                  px: 4,
                }}
              >
                {t("global:save_changes")}
              </Button>
            </Box>
            <TabBar
              setValue={(newTab) => router.push(routeToEditProfile(newTab))}
              labels={{
                about: (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <PersonIcon sx={{ mr: 1, fontSize: 22 }} />
                    {t("profile:heading.about_me")}
                  </Box>
                ),
                home: (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CouchIcon sx={{ mr: 1, fontSize: 22 }} />
                    {t("profile:heading.home")}
                  </Box>
                ),
              }}
              ariaLabel={t("profile:edit_profile_tab_bar_a11y_label")}
              tabListSx={{
                minHeight: 64,
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
              tabSx={{
                fontSize: "1.125rem",
                fontWeight: 600,
                textTransform: "none",
                minHeight: 56,
                padding: theme.spacing(1.5, 3),
                borderRadius: theme.spacing(1.5, 1.5, 0, 0),
                transition: "all 0.2s ease-in-out",
                color: "var(--mui-palette-text-secondary)",

                "&.Mui-selected": {
                  color: "var(--mui-palette-primary-main)",
                  borderBottom: `3px solid var(--mui-palette-primary-main)`,
                  fontWeight: 700,
                },

                "&:hover": {
                  color: "var(--mui-palette-primary-main)",
                },

                [theme.breakpoints.down("md")]: {
                  fontSize: "1rem",
                  padding: theme.spacing(1, 2),
                  minHeight: 48,
                },
              }}
            />
            <TabPanelStyled value="about">
              <EditProfile />
            </TabPanelStyled>
            <TabPanelStyled value="home">
              <EditHostingPreference />
            </TabPanelStyled>
          </TabContext>
        </DetailsCard>
      </Root>
    </>
  );
}
