import { Groups } from "@mui/icons-material";
import { styled, Typography, TypographyProps, useMediaQuery, useTheme } from "@mui/material";
import Alert from "components/Alert";
import CardTrack, { useCardTrack } from "components/CardTrack";
import StyledLink from "components/StyledLink";
import TextBody from "components/TextBody";
import { useListUserCommunities } from "features/communities/hooks";
import { Trans, useTranslation } from "i18n";
import { DASHBOARD } from "i18n/namespaces";
import { routeToCommunity } from "routes";

import DashboardSectionHeader from "./DashboardSectionHeader";

const CARD_WIDTH = 200;

const StyledBrowseCommunitiesLink = styled(StyledLink)(() => ({
  verticalAlign: "baseline",
}));

const CommunityCard = styled(StyledLink)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
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

const CommunityName = styled(Typography)<TypographyProps>({
  fontWeight: 600,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  overflowWrap: "anywhere",
});

const SkeletonCard = styled("div")(({ theme }) => ({
  padding: theme.spacing(1.5),
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 10,
  background: "var(--mui-palette-background-paper)",
}));

export default function CommunitiesList() {
  const { t } = useTranslation([DASHBOARD]);
  const theme = useTheme();
  const cardsPerView = useMediaQuery(theme.breakpoints.down("sm")) ? 2 : 3;

  const { data, isPending, error } = useListUserCommunities();

  const communities = (data?.pages ?? []).flatMap((page) => page.communitiesList);

  const track = useCardTrack({ maxCardsPerScroll: 3 });

  return (
    <div>
      <DashboardSectionHeader icon={Groups} title={t("dashboard:your_communities_heading")} {...track.navProps} />
      <Typography variant="body1" sx={{ paddingBottom: theme.spacing(2) }}>
        <Trans
          i18nKey="dashboard:communities_intro"
          components={{
            browseCommunitiesLink: <StyledBrowseCommunitiesLink href="/communities" underline="hover" />,
          }}
        />
      </Typography>
      {error?.message && <Alert severity="error">{error.message}</Alert>}
      {isPending ? (
        <CardTrack cardWidth={CARD_WIDTH}>
          {Array.from({ length: cardsPerView }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </CardTrack>
      ) : communities.length > 0 ? (
        <CardTrack track={track} cardWidth={CARD_WIDTH}>
          {communities.map((community) => (
            <CommunityCard
              key={`community-${community.communityId}`}
              href={routeToCommunity(community.communityId, community.slug)}
            >
              <CommunityName variant="subtitle2" component="span">
                {community.name}
              </CommunityName>
              <Typography variant="body2" color="textSecondary">
                {t("dashboard:member_count", {
                  count: community.memberCount,
                })}
              </Typography>
            </CommunityCard>
          ))}
        </CardTrack>
      ) : (
        <TextBody>{t("dashboard:no_community")}</TextBody>
      )}
    </div>
  );
}
