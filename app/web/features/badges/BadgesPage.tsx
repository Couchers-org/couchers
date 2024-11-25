import { Divider, List, ListItem, Typography } from "@mui/material";
import CenteredSpinner from "components/CenteredSpinner/CenteredSpinner";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";
import { useTranslation } from "i18n";
import { GLOBAL, PROFILE } from "i18n/namespaces";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  divider: {
    margin: theme.spacing(2),
  },
  flex: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "start",
  },
  content: {
    padding: theme.spacing(2),
    alignSelf: "stretch",
    width: "100%",
  },
  description: {
    paddingTop: theme.spacing(0.5),
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}));

export interface BadgesPageProps {
  badgeId?: string;
}

export default function BadgesPage({ badgeId = undefined }: BadgesPageProps) {
  const { t } = useTranslation([GLOBAL, PROFILE]);
  const { badges, isLoading: isBadgesLoading } = useBadges();
  const classes = useStyles();

  return (
    <>
      <HtmlMeta title={t("global:nav.badges")} />
      <PageTitle>{t("profile:badges.title")}</PageTitle>
      <Typography variant="body1">{t("profile:badges.subtitle")}</Typography>
      <Divider className={classes.divider} />
      <div className={classes.flex}>
        <List>
          {badges &&
            Object.values(badges).map((badge) => (
              <ListItem key={badge.id}>
                <Badge badge={badge} />
              </ListItem>
            ))}
        </List>
        <Divider orientation="vertical" className={classes.divider} flexItem />
        {badgeId ? (
          <div className={classes.content}>
            {isBadgesLoading ? (
              <CenteredSpinner />
            ) : badges && badgeId in badges ? (
              <>
                <div className={classes.flex}>
                  <Badge badge={badges[badgeId]} />
                  <Typography variant="body1" className={classes.description}>
                    {badges[badgeId].description}
                  </Typography>
                </div>
                <Divider className={classes.divider} />
              </>
            ) : (
              <>Badge not found</>
            )}
          </div>
        ) : (
          <div className={`${classes.content} ${classes.center}`}>
            <Typography variant="subtitle1">
              {t("profile:badges.click_on_left")}
            </Typography>
          </div>
        )}
      </div>
    </>
  );
}
