import { ArrowBack, ArrowForward, Groups } from "@mui/icons-material";
import { Box, IconButton, styled, Typography, useMediaQuery, useTheme } from "@mui/material";
import Alert from "components/Alert";
import FadingScrollTrack from "components/FadingScrollTrack";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useListUserCommunities } from "features/communities/hooks";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { useEffect, useRef, useState } from "react";
import { routeToCommunity } from "routes";

const CARD_GAP = 12;
const CARD_WIDTH = 200;

const SectionHeader = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
});

const CardSlot = styled(Box)({
  flex: `0 0 ${CARD_WIDTH}px`,
  minWidth: 0,
  scrollSnapAlign: "start",
});

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { data, isPending, error } = useListUserCommunities();

  const communities = (data?.pages ?? []).flatMap((page) => page.communitiesList);

  const updateScrollState = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(Math.round(el.scrollLeft) < el.scrollWidth - el.clientWidth);
  };

  useEffect(() => {
    updateScrollState();
  }, [communities.length, isPending, cardsPerView]);

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * (CARD_WIDTH + CARD_GAP) * cardsPerView,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <SectionHeader>
        <Typography variant="h2" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
          <Groups sx={{ fontSize: 20, color: "var(--mui-palette-primary-main)" }} />
          {t("dashboard:your_communities_heading")}
          {!isPending && communities.length > 0 && (
            <Box
              component="span"
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--mui-palette-text-secondary)",
                background: "var(--mui-palette-grey-50)",
                borderRadius: 999,
                px: 1.125,
                lineHeight: "20px",
                display: "inline-block",
              }}
            >
              {communities.length}
            </Box>
          )}
        </Typography>
        <div>
          <IconButton
            size="small"
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            color={canScrollLeft ? "primary" : "default"}
            aria-label={t("dashboard:prev_page_button_a11y")}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            color={canScrollRight ? "primary" : "default"}
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
            1: <StyledBrowseCommunitiesLink href="/communities" underline="hover" />,
          }}
        />
      </Typography>
      {error?.message && <Alert severity="error">{error.message}</Alert>}
      {isPending ? (
        <FadingScrollTrack $gap={CARD_GAP} $snapType="x proximity">
          {Array.from({ length: cardsPerView }).map((_, i) => (
            <CardSlot key={i}>
              <SkeletonCard />
            </CardSlot>
          ))}
        </FadingScrollTrack>
      ) : communities.length > 0 ? (
        <FadingScrollTrack
          ref={scrollerRef}
          onScroll={updateScrollState}
          $gap={CARD_GAP}
          $snapType="x proximity"
          $canScrollLeft={canScrollLeft}
          $canScrollRight={canScrollRight}
        >
          {communities.map((community) => (
            <CardSlot key={`community-${community.communityId}`}>
              <CommunityCard href={routeToCommunity(community.communityId, community.slug)}>
                <Typography
                  variant="subtitle2"
                  component="span"
                  sx={{
                    fontWeight: 600,
                  }}
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
        </FadingScrollTrack>
      ) : (
        <TextBody>{t("dashboard:no_community")}</TextBody>
      )}
    </div>
  );
}
