import { Typography } from "@mui/material";
import HtmlMeta from "components/HtmlMeta";
import StyledLink from "components/StyledLink";
import { useAuthContext } from "features/auth/AuthProvider";
import { Trans, useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useEffect, useState } from "react";
import Graphic from "resources/404graphic.png";
import { baseRoute, dashboardRoute } from "routes";
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
  const {
    authState: { authenticated },
  } = useAuthContext();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

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
            <StyledLink
              href={!authenticated || !isMounted ? baseRoute : dashboardRoute}
            >
              go home?
            </StyledLink>
          </Trans>
        </Typography>
      </div>
    </>
  );
}
