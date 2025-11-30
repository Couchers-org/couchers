import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import BetaFlag from "components/BetaFlag";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";

import { ThemeMode, useThemeMode } from "./ThemeModeContext";

interface ThemeModeSettingProps {
  className?: string;
}

export default function ThemeModeSetting({ className }: ThemeModeSettingProps) {
  const { t } = useTranslation(AUTH);
  const { mode, setMode } = useThemeMode();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ThemeMode | null,
  ) => {
    if (newMode !== null) {
      setMode(newMode);
    }
  };

  return (
    <div className={className}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography variant="h2">
          {t("account_settings_page.theme_section.title")}
        </Typography>
        <BetaFlag />
      </Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t("account_settings_page.theme_section.description")}
      </Typography>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleChange}
        aria-label={t("account_settings_page.theme_section.title")}
      >
        <ToggleButton value="light">
          {t("account_settings_page.theme_section.light")}
        </ToggleButton>
        <ToggleButton value="dark">
          {t("account_settings_page.theme_section.dark")}
        </ToggleButton>
        <ToggleButton value="system">
          {t("account_settings_page.theme_section.system")}
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}
