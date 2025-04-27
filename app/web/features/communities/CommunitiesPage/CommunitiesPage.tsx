import { styled,Typography } from "@mui/material";
import MuiLink from "@mui/material/Link";
import PageTitle from "components/PageTitle";
import CommunityBrowser from "features/dashboard/CommunityBrowser";
import { Trans, useTranslation } from "i18n";
import { COMMUNITIES, DASHBOARD, GLOBAL } from "i18n/namespaces";
import React from "react";

const COMMUNITY_BUILDER_FORM_LINK =
  "https://couchers.org/community-builder-form";
const COMMUNITY_GUIDELINES_LINK =
  "https://docs.google.com/document/d/1A9vCdKGQ_WKoyjCh5KScdGgpnighr9yL_F0-OaPT2yA/edit?usp=sharing";

const HeaderRow = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  paddingBottom: theme.spacing(1),
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  paddingBlockStart: theme.spacing(2),
  paddingBlockEnd: theme.spacing(2),
}));

const CommunitiesPage = () => {
  const { t } = useTranslation([COMMUNITIES, DASHBOARD, GLOBAL]);

  return (
    <>
      <div>
        <HeaderRow>
          <PageTitle>{t("communities:communities_title")}</PageTitle>
        </HeaderRow>
      </div>
      <StyledTypography variant="body1" paragraph>
        <Trans i18nKey="dashboard:your_communities_helper_text2">
          {`Don't see your community? `}
          <MuiLink
            href={COMMUNITY_BUILDER_FORM_LINK}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            Get it started!
          </MuiLink>
        </Trans>
      </StyledTypography>
      <StyledTypography variant="body1" paragraph>
        <Trans i18nKey="dashboard:community_guidelines_helper_text">
          {`Learn more about how we build our communities! `}
          <MuiLink
            href={COMMUNITY_GUIDELINES_LINK}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            Read our community guidelines
          </MuiLink>
        </Trans>
      </StyledTypography>

      <CommunityBrowser />
    </>
  );
};

export default CommunitiesPage;
