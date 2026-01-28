import {
  DarkModeOutlined,
  LightModeOutlined,
  SettingsBrightnessOutlined,
} from "@mui/icons-material";
import { Box, Button, styled, Typography } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useTranslation } from "i18n";
import { AUTH } from "i18n/namespaces";
import { useEffect, useRef, useState } from "react";

const ModeDisplay = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

export default function DarkModeSettings() {
  const { t } = useTranslation(AUTH);
  const { mode, setMode } = useColorScheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousModeRef = useRef(mode);

  useEffect(() => {
    if (mode && previousModeRef.current !== mode) {
      setIsTransitioning(false);
      previousModeRef.current = mode;
    }
  }, [mode]);

  if (!mode) {
    return null;
  }

  const handleToggle = () => {
    setIsTransitioning(true);
    if (mode === "light") {
      setMode("dark");
    } else if (mode === "dark") {
      setMode("system");
    } else {
      setMode("light");
    }
  };

  const getModeIcon = () => {
    if (mode === "system") {
      return <SettingsBrightnessOutlined />;
    }
    return mode === "dark" ? <DarkModeOutlined /> : <LightModeOutlined />;
  };

  const getModeText = () => {
    if (mode === "light")
      return t("account_settings_page.appearance_section.modes.light");
    if (mode === "dark")
      return t("account_settings_page.appearance_section.modes.dark");
    return t("account_settings_page.appearance_section.modes.system");
  };

  return (
    <div>
      <Typography variant="h2">
        {t("account_settings_page.appearance_section.title")}
      </Typography>
      <Typography variant="body1">
        {t("account_settings_page.appearance_section.current_mode")}
      </Typography>
      <ModeDisplay>
        {getModeIcon()}
        <Typography variant="body1" component="span" fontWeight="bold">
          {getModeText()}
        </Typography>
      </ModeDisplay>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t("account_settings_page.appearance_section.click_to_change")}
      </Typography>
      <Button
        variant="contained"
        onClick={handleToggle}
        disabled={isTransitioning}
        startIcon={getModeIcon()}
      >
        {t("account_settings_page.appearance_section.change_mode")}
      </Button>
    </div>
  );
}
