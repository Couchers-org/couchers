import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

/**
 * A toggle button for switching between light and dark mode.
 * Uses MUI's useColorScheme hook which automatically handles:
 * - Persisting preference to localStorage
 * - Syncing across tabs
 * - Respecting system preference when set to "system"
 */
export default function DarkModeToggle() {
  const { mode, setMode } = useColorScheme();

  // mode is undefined on first render (SSR), so we need to handle that
  if (!mode) {
    return null;
  }

  const isDark = mode === "dark";
  const nextMode = isDark ? "light" : "dark";

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={() => setMode(nextMode)}
        aria-label={`Switch to ${nextMode} mode`}
        size="small"
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
