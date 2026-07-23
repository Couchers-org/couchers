import { ArrowBack, ArrowForward, Groups } from "@mui/icons-material";
import {
  Box,
  IconButton,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Alert from "components/Alert";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useListUserCommunities } from "features/communities/hooks";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useEffect, useState } from "react";
import { routeToCommunity } from "routes";

import SectionCountBadge from "./SectionCountBadge";

const CARD_GAP = 12;

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
});

const CardRow = styled("div")({
  display: "flex",
  gap: `${CARD_GAP}px`,
  justifyContent: "flex-start",
});

const CardSlot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$perView",
})<{ $perView: number }>(({ $perView }) => ({
  flex: `0 0 calc((100% - ${($perView - 1) * CARD_GAP}px) / ${$perView})`,
  minWidth: 0,
}));

const CommunityCard = styled(StyledLink)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  padding: theme.spacing(1.5),
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-background-paper)",
  transition: "border-color 0.2s, box-shadow 0.2s",
  "&:hover": {
    borderColor: "var(--mui-palette-primary-main)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
}));

const SkeletonCard = styled("div")(({ theme }) => ({
  height: "100%",
  padding: theme.spacing(1.5),
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-background-paper)",
}));

const StyledBrowseCommunitiesLink = styled(StyledLink)(() => ({
  verticalAlign: "baseline",
}));

export default function CommunitiesList() {
  const { t } = useTranslation([DASHBOARD]);
  const theme = useTheme();
  const cardsPerView = useMediaQuery(theme.breakpoints.down("sm")) ? 2 : 3;
  const [pageIndex, setPageIndex] = useState(0);

  const {
    data,
    isPending,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useListUserCommunities();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const communities = (data?.pages ?? []).flatMap(
    (page) => page.communitiesList,
  );

  const pageCount =
    communities.length === 0 ? 0 : Math.ceil(communities.length / cardsPerView);
  const currentPage = Math.min(pageIndex, Math.max(pageCount - 1, 0));
  const visibleCommunities = communities.slice(
    currentPage * cardsPerView,
    currentPage * cardsPerView + cardsPerView,
  );
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < pageCount - 1;

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
          {!isPending && communities.length > 0 && (
            <SectionCountBadge count={communities.length} />
          )}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => setPageIndex(currentPage - 1)}
            disabled={!canGoPrev}
            color={canGoPrev ? "primary" : "default"}
            aria-label={t("dashboard:prev_page_button_a11y")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setPageIndex(currentPage + 1)}
            disabled={!canGoNext}
            color={canGoNext ? "primary" : "default"}
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
        <Trans
          i18nKey="dashboard:your_communities_helper_text"
          components={{
            1: (
              <StyledBrowseCommunitiesLink
                href="/communities"
                underline="hover"
              />
            ),
          }}
        />
      </Typography>
      {error?.message && <Alert severity="error">{error.message}</Alert>}
      {isPending ? (
        <CardRow>
          {Array.from({ length: cardsPerView }).map((_, i) => (
            <CardSlot key={i} $perView={cardsPerView}>
              <SkeletonCard />
            </CardSlot>
          ))}
        </CardRow>
      ) : communities.length > 0 ? (
        <CardRow>
          {visibleCommunities.map((community) => (
            <CardSlot
              key={`community-${community.communityId}`}
              $perView={cardsPerView}
            >
              <CommunityCard
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
            </CardSlot>
          ))}
        </CardRow>
      ) : (
        <TextBody>{t("dashboard:no_community")}</TextBody>
      )}
    </div>
  );
}
