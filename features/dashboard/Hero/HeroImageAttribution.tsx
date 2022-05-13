import { Link as MuiLink, ThemeProvider, Typography } from "@material-ui/core";
import makeStyles from "utils/makeStyles";

import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

const useStyles = makeStyles((theme) => ({
  attribution: {
    position: "absolute",
    bottom: 0,
    right: 0,
    zIndex: 1,
    background: theme.palette.action.active,
    padding: theme.spacing(0, 1),
    opacity: 0.5,
    transition: `opacity ${theme.transitions.duration.short}ms ${theme.transitions.easing.easeInOut}`,
    "&:hover": {
      opacity: 1,
    },
  },
}));

// photo URL: https://unsplash.com/phouiLink>tos/eOcyhe5-9sQ?
const authorUrl =
  "https://unsplash.com/@directormesut?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText";
const unsplashUrl =
  "https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText";

export default function HeroImageAttribution() {
  const classes = useStyles();

  // because this component is over an image background, we need to use a theme that overrides some styles
  const heroBackgroundTheme = useHeroBackgroundTheme();

  return (
    <ThemeProvider theme={heroBackgroundTheme}>
      <Typography
        className={classes.attribution}
        color="textPrimary"
        variant="body2"
      >
        {`Photo by `}
        <MuiLink href={authorUrl} variant="inherit">
          Mesut Kaya
        </MuiLink>
        {` on `}
        <MuiLink href={unsplashUrl} variant="inherit">
          Unsplash
        </MuiLink>
      </Typography>
    </ThemeProvider>
  );
}
