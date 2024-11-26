import { StyledEngineProvider, Theme, ThemeProvider } from "@mui/material";
import Button from "components/Button";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { searchRoute } from "routes";
import makeStyles from "utils/makeStyles";

import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

const useStyles = makeStyles((theme) => ({
  textGradient: {
    backgroundColor: "white",
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

export default function HeroButton() {
  const { t } = useTranslation(DASHBOARD);
  const classes = useStyles();

  // because this component is over an image background and has a special button, we adjust the theme
  const heroTheme = useHeroBackgroundTheme();

  return (
    <div className={classes.buttonContainer}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={heroTheme}>
          <Link href={searchRoute} passHref>
            <Button variant="contained" size="large">
              <span className={classes.textGradient}>{t("show_map")}</span>
            </Button>
          </Link>
        </ThemeProvider>
      </StyledEngineProvider>
    </div>
  );
}
