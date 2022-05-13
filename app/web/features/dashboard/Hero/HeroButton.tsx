import { createTheme, Theme, ThemeProvider, useTheme } from "@material-ui/core";
import Button from "components/Button";
import Link from "next/link";
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
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    margin: theme.spacing(6, 0),
  },
}));

export default function HeroButon() {
  const classes = useStyles();
  const theme = useTheme();
  const coverButtonTheme = useMemo(() => getHeroButtonTheme(theme), [theme]);
  return (
    <div className={classes.buttonContainer}>
      <ThemeProvider theme={coverButtonTheme}>
        <Link href={searchRoute} passHref>
          <Button variant="contained" size="large">
            <span className={classes.textGradient}>Show Map</span>
          </Button>
        </Link>
      </ThemeProvider>
    </div>
  );
}
