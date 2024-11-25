import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import {
  Divider,
  DividerProps,
  List,
  ListItem,
  styled,
  Typography,
} from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";

const StyledDivider = styled(Divider)<DividerProps>(({ theme }) => ({
  margin: theme.spacing(2),
}));

const FlexDiv = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  alignItems: "start",
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

  return (
    <>
      <HtmlMeta title={t("global:nav.badges")} />
      <PageTitle>{t("profile:badges.title")}</PageTitle>
      <Typography variant="subtitle1">
        {t("profile:badges.subtitle")}
      </Typography>
      <StyledDivider />
      <FlexDiv>
        <List>
          {badges &&
            Object.values(badges).map((badge) => (
              <ListItem key={badge.id}>
                <Badge badge={badge} />
              </ListItem>
            ))}
        </List>
        <StyledDivider orientation="vertical" flexItem />
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
                <StyledDivider />
              </>
            ) : (
              <>Badge not found</>
            )}
          </ContentDiv>
        ) : (
          <CenteredDiv>
            <Typography variant="subtitle1">
              {t("profile:badges.click_on_left")}
            </Typography>
          </CenteredDiv>
        )}
      </FlexDiv>
    </>
  );
}
