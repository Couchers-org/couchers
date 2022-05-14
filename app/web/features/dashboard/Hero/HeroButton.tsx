import { createTheme, Theme, ThemeProvider, useTheme } from "@material-ui/core";
import Button from "components/Button";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { useMemo } from "react";
import { searchRoute } from "routes";
import makeStyles from "utils/makeStyles";

// because this component is over an image background and has a special button, we adjust the theme
const getHeroButtonTheme = (theme: Theme) =>
  createTheme({
    ...theme,
    palette: {
      ...theme.palette,
      primary: {
        main: "#ffffff",
      },
    },
    shape: {
      ...theme.shape,
      borderRadius: 32, // px
    },
    typography: {
      ...theme.typography,
      button: {
        ...theme.typography.button,
        fontWeight: 700,
      },
    },
  });

const useStyles = makeStyles((theme) => ({
  textGradient: {
    background: `-webkit-linear-gradient(0deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    "-webkit-background-clip": "text",
    "-webkit-text-fill-color": "transparent",

    // fallback
    color: theme.palette.primary.main,
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
  const theme = useTheme();
  const coverButtonTheme = useMemo(() => getHeroButtonTheme(theme), [theme]);
  return (
    <div className={classes.buttonContainer}>
      <ThemeProvider theme={coverButtonTheme}>
        <Link href={searchRoute} passHref>
          <Button variant="contained" size="large">
            <span className={classes.textGradient}>{t("show_map")}</span>
          </Button>
        </Link>
      </ThemeProvider>
    </div>
  );
}
