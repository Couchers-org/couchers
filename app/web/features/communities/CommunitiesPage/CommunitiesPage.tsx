import { ExpandMoreOutlined, ExploreOutlined } from "@mui/icons-material";
import { Button, Collapse, styled, Typography } from "@mui/material";
import MuiLink from "@mui/material/Link";
import PageTitle from "components/PageTitle";
import useAccountInfo from "features/auth/useAccountInfo";
import CommunitiesList from "features/dashboard/CommunitiesList";
import CommunityBrowser from "features/dashboard/CommunityBrowser";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { communityCreationFormURL, helpCenterCommunityBuilderURL } from "routes";

import NewCommunities from "../NewCommunities";
import CommunitySearch from "./CommunitySearch";

const HeaderRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  flexDirection: "column",
  width: "100%",
  paddingBottom: theme.spacing(2),
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  fontSize: "1.25rem",
  paddingBottom: theme.spacing(1),
}));

const MainTitle = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  fontSize: "2rem",
  paddingBottom: theme.spacing(2),
  paddingTop: theme.spacing(2),
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  paddingBlockEnd: theme.spacing(1),
}));

const BrowserContainer = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(3),
  backgroundColor: "var(--mui-palette-grey-50)",
  borderRadius: theme.spacing(1),
  border: `1px solid var(--mui-palette-divider)`,
}));

const BrowserHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
}));

const BrowserTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "1rem",
  color: "var(--mui-palette-text-primary)",
}));

const ExpandButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
  "& .MuiButton-endIcon": {
    transition: "transform 0.3s",
  },
  "&.expanded .MuiButton-endIcon": {
    transform: "rotate(180deg)",
  },
}));

const CommunitiesPage = () => {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);
  const { data: accountInfo } = useAccountInfo();
  const [browserExpanded, setBrowserExpanded] = useState(false);

  return (
    <>
      <div>
        <HeaderRow>
          <PageTitle>{t("nav.communities")}</PageTitle>
        </HeaderRow>
      </div>
      <Subtitle variant="h2">{t("dashboard:communities_welcome_title")}</Subtitle>
      <StyledTypography variant="body1" sx={{ marginBottom: "16px" }}>
        <Trans i18nKey="dashboard:communities_intro" />
      </StyledTypography>
      <StyledTypography variant="body1" sx={{ marginBottom: "16px" }}>
        <Trans
          i18nKey="dashboard:community_builder"
          components={{
            communityBuilderLink: (
              <MuiLink
                href={helpCenterCommunityBuilderURL}
                target="_blank"
                rel="noreferrer noopener"
                underline="hover"
              />
            ),
          }}
        />
      </StyledTypography>

      <MainTitle variant="h1">{t("dashboard:my_communities_heading")}</MainTitle>
      <CommunitiesList />

      <MainTitle variant="h1">{t("dashboard:find_your_community")}</MainTitle>

      <StyledTypography variant="body1" sx={{ marginBottom: "16px" }}>
        <Trans
          i18nKey="dashboard:find_your_community_intro_simplified"
          components={{
            requestCommunityLink: (
              <MuiLink
                href={communityCreationFormURL(accountInfo?.username)}
                target="_blank"
                rel="noreferrer noopener"
                underline="hover"
              />
            ),
          }}
        />
      </StyledTypography>

      <NewCommunities />

      <CommunitySearch />

      <BrowserContainer>
        <BrowserHeader>
          <ExploreOutlined color="action" />
          <BrowserTitle>{t("dashboard:browse_all_communities")}</BrowserTitle>
        </BrowserHeader>

        <StyledTypography variant="body2" color="textSecondary">
          <Trans i18nKey="dashboard:browse_communities_text" />
        </StyledTypography>

        <Collapse in={browserExpanded} timeout="auto">
          <CommunityBrowser />
        </Collapse>

        <ExpandButton
          onClick={() => setBrowserExpanded(!browserExpanded)}
          endIcon={<ExpandMoreOutlined />}
          className={browserExpanded ? "expanded" : ""}
          variant="text"
        >
          {browserExpanded ? t("dashboard:hide_all_communities") : t("dashboard:show_all_communities")}
        </ExpandButton>
      </BrowserContainer>
    </>
  );
};

export default CommunitiesPage;
