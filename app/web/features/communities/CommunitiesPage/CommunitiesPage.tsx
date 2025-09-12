import { Typography, styled } from "@mui/material";
import MuiLink from "@mui/material/Link";
import React from "react";

import PageTitle from "@/components/PageTitle";
import useAccountInfo from "@/features/auth/useAccountInfo";
import CommunityBrowser from "@/features/dashboard/CommunityBrowser";
import { Trans, useTranslation } from "@/i18n";
import { DASHBOARD, GLOBAL } from "@/i18n/namespaces";
import {
  HELP_CENTER_COMMUNITY_BUILDER_URL,
  communityCreationFormUrl,
} from "@/routes";

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

// const StyledTypography = styled(Typography)(({ theme }) => ({
//   paddingBlockEnd: theme.spacing(1),
// }));

const StyledParagraph = styled("p")(({ theme }) => ({
  paddingBlockEnd: theme.spacing(1),
}));

const CommunitiesPage = () => {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);

  const { data: accountInfo } = useAccountInfo();

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
      <Typography variant="body1" component={StyledParagraph}>
        <Trans i18nKey="dashboard:communities_intro" />
      </Typography>
      <Typography variant="body1" component={StyledParagraph}>
        <Trans i18nKey="dashboard:community_builder">
          {`Want to be an ambassador for your community and help it grow? Become a `}
          <MuiLink
            href={HELP_CENTER_COMMUNITY_BUILDER_URL}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            Community Builder!
          </MuiLink>
        </Trans>
      </Typography>

      <Subtitle variant="h2">{t("dashboard:all_communities_section")}</Subtitle>

      <Typography variant="body1" component={StyledParagraph}>
        <Trans i18nKey="dashboard:all_communities_intro" />
      </Typography>

      <Typography variant="body1" component={StyledParagraph}>
        <Trans i18nKey="dashboard:community_missing">
          {`Is your country or city missing? `}
          <MuiLink
            href={communityCreationFormUrl(accountInfo?.username)}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            Use this form
          </MuiLink>
          {` to request it!`}
        </Trans>
      </Typography>

      <CommunityBrowser />
    </>
  );
};

export default CommunitiesPage;
