import { StyledEngineProvider, ThemeProvider, styled } from "@mui/material";
import { useTranslation } from "next-i18next";
import Link from "next/link";

import Button from "@/components/Button";
import { DASHBOARD } from "@/i18n/namespaces";
import { SEARCH_ROUTE } from "@/routes";
import { theme } from "@/theme";

import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  margin: theme.spacing(6, 0),
}));

const HeroButton = () => {
  const { t } = useTranslation(DASHBOARD);

  // because this component is over an image background and has a special button, we adjust the theme
  const heroTheme = useHeroBackgroundTheme();

  return (
    <StyledButtonContainer>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={heroTheme}>
          <Button
            component={Link}
            href={SEARCH_ROUTE}
            variant="contained"
            size="large"
            sx={{
              "& span": {
                background: `-webkit-linear-gradient(0deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              },
            }}
          >
            <span>{t("show_map")}</span>
          </Button>
        </ThemeProvider>
      </StyledEngineProvider>
    </StyledButtonContainer>
  );
};

export default HeroButton;
