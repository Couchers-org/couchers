import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const { t } = useTranslation(GLOBAL);
  const { mode, systemMode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch
  if (!mounted || !mode) {
    return null;
  }

  // Determine the actual displayed mode (resolving "system" to the actual mode)
  const resolvedMode = mode === "system" ? systemMode : mode;
  const isDark = resolvedMode === "dark";

  const handleToggle = () => {
    // Simply toggle between light and dark
    setMode(isDark ? "light" : "dark");
  };

  const tooltipText = isDark
    ? t("nav.switch_to_light_mode")
    : t("nav.switch_to_dark_mode");

  return (
    <Tooltip title={tooltipText}>
      <IconButton
        onClick={handleToggle}
        aria-label={tooltipText}
        sx={{
          color: "var(--mui-palette-text-primary)",
          "&:hover": {
            backgroundColor: "transparent",
            "& .MuiSvgIcon-root": {
              color: "var(--mui-palette-primary-main)",
            },
          },
        }}
      >
        {isDark ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  );
}
