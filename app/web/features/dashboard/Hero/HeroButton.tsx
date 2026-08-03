import { styled, StyledEngineProvider, ThemeProvider } from "@mui/material";
import Button from "components/Button";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { searchRoute } from "routes";

import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  margin: theme.spacing(6, 0),
}));

export default function HeroButton() {
  const { t } = useTranslation(DASHBOARD);

  // because this component is over an image background, we adjust the theme
  const heroTheme = useHeroBackgroundTheme();

  return (
    <StyledButtonContainer>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={heroTheme}>
          <Button component={Link} href={searchRoute} variant="contained" size="large">
            {t("show_map")}
          </Button>
        </ThemeProvider>
      </StyledEngineProvider>
    </StyledButtonContainer>
  );
}
