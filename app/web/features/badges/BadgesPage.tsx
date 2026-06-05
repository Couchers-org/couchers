import { useFeatureValue } from "@growthbook/growthbook-react";
import {
  Divider,
  DividerProps,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";

import BadgeDetail from "./BadgeDetail";

const BadgeListItem = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "inline-block",
  },
}));

const StyledDivider = styled(Divider)<DividerProps>(({ theme }) => ({
  margin: theme.spacing(2),
}));

const ParentFlexDiv = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "start",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
    gap: theme.spacing(0),
  },
}));

const ContentDiv = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
  alignSelf: "stretch",
  width: "100%",
}));

const CenteredDiv = styled(ContentDiv)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

interface BadgesPageProps {
  badgeId?: string;
}

export default function BadgesPage({ badgeId = undefined }: BadgesPageProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const { badges } = useBadges();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // the catalog still lists the moderator badge; the award job stops granting it once
  // show_moderator_badge is off, so hide it from the explorer to match.
  const showModeratorBadge = useFeatureValue("show_moderator_badge", true);
  const isHiddenBadge = (badgeId: string) =>
    badgeId === "moderator" && !showModeratorBadge;

  return (
    <>
      <HtmlMeta title={t("global:nav.badges")} />
      <PageTitle>{t("profile:badges.title")}</PageTitle>
      <Typography variant="subtitle1">
        {t("profile:badges.subtitle")}
      </Typography>
      <StyledDivider />
      <ParentFlexDiv>
        <div>
          {badges &&
            Object.values(badges)
              .filter((badge) => !isHiddenBadge(badge.id))
              .map((badge) => (
                <BadgeListItem key={badge.id}>
                  <Badge badge={badge} />
                </BadgeListItem>
              ))}
        </div>
        <StyledDivider
          orientation={isMobile ? "horizontal" : "vertical"}
          flexItem
        />
        {badgeId ? (
          <ContentDiv>
            <BadgeDetail badgeId={badgeId} />
          </ContentDiv>
        ) : (
          <CenteredDiv>
            <Typography variant="subtitle1">
              {t("profile:badges.click_on_left")}
            </Typography>
          </CenteredDiv>
        )}
      </ParentFlexDiv>
    </>
  );
}
