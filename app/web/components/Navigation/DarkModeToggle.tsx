import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { GLOBAL } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import useResolvedColorScheme from "utils/useResolvedColorScheme";

export default function DarkModeToggle() {
  const { t } = useTranslation(GLOBAL);
  const { setMode } = useColorScheme();
  const resolvedMode = useResolvedColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch
  if (!mounted || !resolvedMode) {
    return null;
  }

  const isDark = resolvedMode === "dark";

  const handleToggle = () => {
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
          padding: 0.5,
          margin: 0,
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
