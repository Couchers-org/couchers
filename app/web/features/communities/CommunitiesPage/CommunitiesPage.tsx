import { styled, Typography } from "@mui/material";
import MuiLink from "@mui/material/Link";
import PageTitle from "components/PageTitle";
import CommunityBrowser from "features/dashboard/CommunityBrowser";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import React from "react";

const COMMUNITY_BUILDER_FORM_LINK =
  "https://couchers.org/community-builder-form";
const COMMUNITY_GUIDELINES_LINK =
  "https://help.couchers.org/hc/couchersorg-help-center/articles/1743977410-what-is-a-community-builder";

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

const StyledTypography = styled(Typography)(({ theme }) => ({
  paddingBlockEnd: theme.spacing(1),
}));

const CommunitiesPage = () => {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);

  return (
    <>
      <div>
        <HeaderRow>
          <PageTitle>{t("nav.communities")}</PageTitle>
        </HeaderRow>
      </div>
      <Subtitle variant="h2">
        {t("dashboard:communities_welcome_title")}
      </Subtitle>
      <StyledTypography variant="body1" paragraph>
        <Trans i18nKey="dashboard:communities_intro" />
      </StyledTypography>
      <StyledTypography variant="body1" paragraph>
        <Trans i18nKey="dashboard:community_builder">
          {`Want to be an ambassador for your community and help it grow? Become a `}
          <MuiLink
            href={COMMUNITY_GUIDELINES_LINK}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            Community Builder!
          </MuiLink>
        </Trans>
      </StyledTypography>

      <Subtitle variant="h2">{t("dashboard:all_communities_section")}</Subtitle>

      <StyledTypography variant="body1" paragraph>
        <Trans i18nKey="dashboard:all_communities_intro" />
      </StyledTypography>

      <StyledTypography variant="body1" paragraph>
        <Trans i18nKey="dashboard:community_missing">
          {`Is your country or city missing? `}
          <MuiLink
            href={COMMUNITY_BUILDER_FORM_LINK}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            Use this form
          </MuiLink>
          {` to request it!`}
        </Trans>
      </StyledTypography>

      <CommunityBrowser />
    </>
  );
};

export default CommunitiesPage;
