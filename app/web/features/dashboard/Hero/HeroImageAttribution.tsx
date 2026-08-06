import { Link as MuiLink, styled, StyledEngineProvider, ThemeProvider, Typography } from "@mui/material";
import { Trans } from "next-i18next";
import { theme } from "theme";

import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

const StyledAttribution = styled(Typography)(() => ({
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
}));

// photo URL: https://unsplash.com/phouiLink>tos/eOcyhe5-9sQ?
const authorUrl =
  "https://unsplash.com/@directormesut?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText";
const unsplashUrl = "https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText";

export default function HeroImageAttribution() {
  // because this component is over an image background, we need to use a theme that overrides some styles
  const heroBackgroundTheme = useHeroBackgroundTheme();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={heroBackgroundTheme}>
        <StyledAttribution color="textPrimary" variant="body2">
          <Trans
            i18nKey="dashboard:hero_image_attribution"
            components={{
              photographerLink: (
                <MuiLink
                  href={authorUrl}
                  variant="inherit"
                  rel="noreferrer noopener"
                  target="_blank"
                  underline="hover"
                />
              ),
              unsplashLink: (
                <MuiLink
                  href={unsplashUrl}
                  variant="inherit"
                  rel="noreferrer noopener"
                  target="_blank"
                  underline="hover"
                />
              ),
            }}
          />
        </StyledAttribution>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
