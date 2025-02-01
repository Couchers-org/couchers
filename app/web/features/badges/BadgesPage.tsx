import {
  Divider,
  DividerProps,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";

import BadgeUserList from "./BadgeUserList";

const BadgeListItem = styled("div")(({ theme }) => ({
  [theme.breakpoints.down("md")]: {
    display: "inline-block",
  },
}));

const StyledDivider = styled(Divider)<DividerProps>(({ theme }) => ({
  margin: theme.spacing(2),
}));

const FlexDiv = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "start",
}));

const ParentFlexDiv = styled(FlexDiv)(({ theme }) => ({
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

const CenteredDiv = styled(ContentDiv)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export interface BadgesPageProps {
  badgeId?: string;
}

export default function BadgesPage({ badgeId = undefined }: BadgesPageProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const { badges, isLoading: isBadgesLoading } = useBadges();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
            Object.values(badges).map((badge) => (
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
            {isBadgesLoading ? (
              <CenteredSpinner />
            ) : badges && badgeId in badges ? (
              <>
                <FlexDiv>
                  <Badge badge={badges[badgeId]} />
                  <Typography variant="body1">
                    {badges[badgeId].description}
                  </Typography>
                </FlexDiv>
                <BadgeUserList badgeId={badgeId} />
              </>
            ) : (
              <>{t("profile:badges.not_found")}</>
            )}
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
