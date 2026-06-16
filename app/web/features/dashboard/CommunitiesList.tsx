import { ArrowBack, ArrowForward, Groups } from "@mui/icons-material";
import { IconButton, styled, Typography, useMediaQuery } from "@mui/material";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useListUserCommunities } from "features/communities/hooks";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useState } from "react";
import { routeToCommunity } from "routes";
import { theme } from "theme";

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
});

const GridContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
}));

const CommunityCard = styled(StyledLink)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1.5),
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: theme.spacing(1),
  transition: "border-color 0.2s, box-shadow 0.2s",
  "&:hover": {
    borderColor: "var(--mui-palette-primary-main)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
}));

const SkeletonCard = styled("div")(({ theme }) => ({
  padding: theme.spacing(1.5),
  border: `1px solid var(--mui-palette-grey-300)`,
  borderRadius: theme.spacing(1),
}));

const StyledBrowseCommunitiesLink = styled(StyledLink)(() => ({
  verticalAlign: "baseline",
}));

export default function CommunitiesList() {
  const { t } = useTranslation([DASHBOARD]);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const pageSize = isSmallScreen ? 2 : 3;
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<(string | undefined)[]>([]);

  const { data, isPending, error } = useListUserCommunities({
    pageSize,
    pageToken,
  });

  const communities = data?.communitiesList ?? [];
  const hasPrev = history.length > 0;
  const hasNext = Boolean(data?.nextPageToken);

  const goNext = () => {
    setHistory((h) => [...h, pageToken]);
    setPageToken(data?.nextPageToken);
  };

  const goPrev = () => {
    setHistory((h) => {
      const prev = [...h];
      const token = prev.pop();
      setPageToken(token);
      return prev;
    });
  };

  return (
    <div>
      <SectionHeader>
        <Typography
          variant="h2"
          sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
        >
          <Groups
            sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }}
          />
          {t("dashboard:your_communities_heading")}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={goPrev}
            disabled={!hasPrev}
            color={hasPrev ? "primary" : "default"}
            aria-label={t("dashboard:prev_page_button_a11y")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={goNext}
            disabled={!hasNext}
            color={hasNext ? "primary" : "default"}
            aria-label={t("dashboard:next_page_button_a11y")}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </div>
      </SectionHeader>
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
      {error?.message && <Alert severity="error">{error.message}</Alert>}
      {isPending ? (
        <GridContainer>
          {Array.from({ length: pageSize }).map((_, i) => (
            <SkeletonCard key={i}></SkeletonCard>
          ))}
        </GridContainer>
      ) : communities.length > 0 ? (
        <>
          <GridContainer>
            {communities.map((community) => (
              <CommunityCard
                key={`community-${community.communityId}`}
                href={routeToCommunity(community.communityId, community.slug)}
              >
                <Typography
                  variant="subtitle2"
                  component="span"
                  fontWeight={600}
                >
                  {community.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {t("dashboard:member_count", {
                    count: community.memberCount,
                  })}
                </Typography>
              </CommunityCard>
            ))}
          </GridContainer>
        </>
      ) : (
        <TextBody>{t("dashboard:no_community")}</TextBody>
      )}
    </div>
  );
}
