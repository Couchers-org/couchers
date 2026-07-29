import { Link as MuiLink, styled, Typography } from "@mui/material";
import useAccountInfo from "features/auth/useAccountInfo";
import CommunitiesList from "features/dashboard/CommunitiesList";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD, GLOBAL } from "i18n/namespaces";
import { communityCreationFormURL } from "routes";
import { theme } from "theme";

const StyledCreateCommunityText = styled(Typography)(() => ({
  paddingBlockStart: theme.spacing(2),
}));

export default function CommunitiesSection() {
  useTranslation([GLOBAL, DASHBOARD]);
  const { data: accountInfo } = useAccountInfo();

  return (
    <>
      <CommunitiesList />
      <StyledCreateCommunityText variant="body1" sx={{ marginBottom: "16px" }}>
        <Trans
          i18nKey="dashboard:your_communities_helper_text2"
          components={{
            1: (
              <MuiLink
                href={communityCreationFormURL(accountInfo?.username)}
                target="_blank"
                rel="noreferrer noopener"
                underline="hover"
              />
            ),
          }}
        />
      </StyledCreateCommunityText>
    </>
  );
}
