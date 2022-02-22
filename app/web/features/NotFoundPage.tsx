import { Typography } from "@material-ui/core";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import { Trans, useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Graphic from "resources/404graphic.png";
import { baseRoute } from "routes";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  graphic: {
    height: "50%",
    width: "50%",
    margin: theme.spacing(8, 0),
  },
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

export default function NotFoundPage() {
  const { t } = useTranslation(GLOBAL);
  const classes = useStyles();

  return (
    <>
      <HtmlMeta title={t("not_found_text_1")} />
      <div className={classes.root}>
        <img
          src={Graphic.src}
          alt={t("not_found_alt")}
          className={classes.graphic}
        />
        <Typography>{t("not_found_text_1")}</Typography>
        <Typography>
          <Trans t={t} i18nKey="not_found_text_2">
            Do you just want to
            <StyledLink href={baseRoute}>go home?</StyledLink>
          </Trans>
        </Typography>
      </div>
    </>
  );
}
