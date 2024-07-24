import { Divider, List, ListItem, Typography } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import Badge from "features/badges/Badge";
import { useBadges } from "features/badges/hooks";
import { useTranslation } from "i18n";
import { BADGES, GLOBAL } from "i18n/namespaces";
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
  },
  description: {
    paddingTop: theme.spacing(0.5),
  },
}));

export interface BadgesPageProps {
  badgeId?: string;
}

export default function BadgesPage({ badgeId = undefined }: BadgesPageProps) {
  const { t } = useTranslation([GLOBAL, BADGES]);
  const { badges } = useBadges();
  const classes = useStyles();

  return (
    <>
      <HtmlMeta title={t("global:nav.badges")} />
      <PageTitle>{t("badges:index.title")}</PageTitle>
      <Typography variant="body1">{t("badges:index.subtitle")}</Typography>
      <Divider className={classes.divider} />
      <div className={classes.flex}>
        <List>
          {badges && (
            Object.values(badges).map((badge) => (
              <ListItem key={badge.id}>
                <Badge badge={badge} />
              </ListItem>
          )))}
        </List>
        <Divider orientation="vertical" className={classes.divider} flexItem />
        <div className={classes.content}>
          {badgeId && (
            <>
              <div className={classes.flex}>
                <Badge badge={badges[badgeId]} />
                <Typography variant="body1" className={classes.description}>
                  {t(`badges:badges.${badgeId}.description`)}
                </Typography>
              </div>
              <Divider className={classes.divider} />
            </>
          )}
          {!badgeId && (
            <Typography variant="body1">Choose a badge on the left</Typography>
          )}
        </div>
      </div>
    </>
  );
}
