import { ThemeProvider } from "@material-ui/core";
import Button from "components/Button";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { searchRoute } from "routes";
import makeStyles from "utils/makeStyles";

import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

const useStyles = makeStyles((theme) => ({
  textGradient: {
    background: `-webkit-linear-gradient(0deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    "-webkit-background-clip": "text",
    "-webkit-text-fill-color": "transparent",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    margin: theme.spacing(6, 0),
  },
}));

export default function HeroButon() {
  const { t } = useTranslation(DASHBOARD);
  const classes = useStyles();

  // because this component is over an image background and has a special button, we adjust the theme
  const heroTheme = useHeroBackgroundTheme();

  return (
    <div className={classes.buttonContainer}>
      <ThemeProvider theme={heroTheme}>
        <Link href={searchRoute} passHref>
          <Button variant="contained" size="large">
            <span className={classes.textGradient}>{t("show_map")}</span>
          </Button>
        </Link>
      </ThemeProvider>
    </div>
  );
}
