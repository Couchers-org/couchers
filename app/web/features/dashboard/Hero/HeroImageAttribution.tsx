import {
  Link as MuiLink,
  StyledEngineProvider,
  Theme,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { Trans } from "next-i18next";
import makeStyles from "utils/makeStyles";

import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

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
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={heroBackgroundTheme}>
        <Typography
          className={classes.attribution}
          color="textPrimary"
          variant="body2"
        >
          <Trans i18nKey="dashboard:hero_image_attribution">
            {`Photo by `}
            <MuiLink
              href={authorUrl}
              variant="inherit"
              rel="noreferrer noopener"
              target="_blank"
              underline="hover"
            >
              Mesut Kaya
            </MuiLink>
            {` on `}
            <MuiLink
              href={unsplashUrl}
              variant="inherit"
              rel="noreferrer noopener"
              target="_blank"
              underline="hover"
            >
              Unsplash
            </MuiLink>
          </Trans>
        </Typography>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
