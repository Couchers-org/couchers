import { Link as MuiLink, Typography, styled } from "@mui/material";

import StyledLink from "@/components/StyledLink";
import useAccountInfo from "@/features/auth/useAccountInfo";
import CommunitiesList from "@/features/dashboard/CommunitiesList";
import { Trans, useTranslation } from "@/i18n";
import { DASHBOARD, GLOBAL } from "@/i18n/namespaces";
import { communityCreationFormUrl } from "@/routes";
import { theme } from "@/theme";

const StyledBrowseCommunitiesLink = styled(StyledLink)(() => ({
  verticalAlign: "baseline",
}));

const StyledCreateCommunityText = styled("p")(() => ({
  paddingBlockStart: theme.spacing(2),
}));

const CommunitiesSection = () => {
  const { t } = useTranslation([GLOBAL, DASHBOARD]);
  const { data: accountInfo } = useAccountInfo();

  return (
    <>
      <Typography variant="h2" gutterBottom>
        {t("dashboard:your_communities_heading")}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          marginBottom: "16px",
        }}
      >
        <Trans i18nKey="dashboard:your_communities_helper_text">
          {`You have been added to all communities based on your location. Feel free to `}
          <StyledBrowseCommunitiesLink href="/communities" underline="hover">
            browse communities
          </StyledBrowseCommunitiesLink>
          {` in other locations as well.`}
        </Trans>
      </Typography>
      <CommunitiesList />

      <Typography variant="body1" component="p">
        awga
      </Typography>

      <Typography variant="body1" component={StyledCreateCommunityText}>
        <Trans i18nKey="dashboard:your_communities_helper_text2">
          {`Don't see your community? `}
          <MuiLink
            href={communityCreationFormUrl(accountInfo?.username)}
            target="_blank"
            rel="noreferrer noopener"
            underline="hover"
          >
            Get it started!
          </MuiLink>
        </Trans>
      </Typography>
    </>
  );
};

export default CommunitiesSection;
