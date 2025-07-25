import { styled, StyledEngineProvider, ThemeProvider } from "@mui/material";
import Button from "components/Button";
import { DASHBOARD } from "i18n/namespaces";
import Link from "next/link";
import { useTranslation } from "next-i18next";

import { searchRoute } from "../../../routes";
import { theme } from "../../../theme";
import useHeroBackgroundTheme from "./useHeroBackgroundTheme";

const StyledButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  margin: theme.spacing(6, 0),
}));

export default function HeroButton() {
  const { t } = useTranslation(DASHBOARD);

  // because this component is over an image background and has a special button, we adjust the theme
  const heroTheme = useHeroBackgroundTheme();

  return (
    <StyledButtonContainer>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={heroTheme}>
          <Button
            component={Link}
            href={searchRoute}
            variant="contained"
            size="large"
            sx={{
              "& span": {
                background: `-webkit-linear-gradient(0deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                "-webkit-background-clip": "text",
                "-webkit-text-fill-color": "transparent",
              },
            }}
          >
            <span>{t("show_map")}</span>
          </Button>
        </ThemeProvider>
      </StyledEngineProvider>
    </StyledButtonContainer>
  );
}
