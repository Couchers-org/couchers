import { Divider, List, ListItem, Typography } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import PageTitle from "components/PageTitle";
import { useTranslation } from "i18n";
import { BADGES, GLOBAL } from "i18n/namespaces";
import { useBadges } from "features/badges/hooks";
import Badge from "features/badges/Badge";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  divider: {
    marginTop: theme.spacing(2),
  },
  item: {
    display: "flex",
    gap: theme.spacing(2),
  },
}));

export default function BadgesPage() {
  const { t } = useTranslation([GLOBAL, BADGES]);
  const { badges } = useBadges();
  const classes = useStyles();

  return (
    <>
      <HtmlMeta title={t("global:nav.badges")} />
      <PageTitle>{t("badges:index.title")}</PageTitle>
      <Typography variant="body1">{t("badges:index.subtitle")}</Typography>
      <Divider className={classes.divider} />
      <List>
        {Object.values(badges).map((badge) => (
          <ListItem key={badge.id} className={classes.item} >
            <Badge badge={badge} />
            <Typography variant="body1">{t(`badges:badges.${badge.id}.description`)}</Typography>
          </ListItem>
        ))}
      </List>
    </>
  );
}
