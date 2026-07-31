import { useColorScheme } from "@mui/material/styles";

/**
 * The color scheme actually in effect. `mode` is the user's preference, which
 * is `"system"` unless they've explicitly picked light or dark; `systemMode`
 * resolves it in that case.
 *
 * `undefined` until the mode is known, so callers can avoid hydration
 * mismatches. Only needed for non-MUI code — for styling, use CSS variables.
 */
export default function useResolvedColorScheme(): "light" | "dark" | undefined {
  const { mode, systemMode } = useColorScheme();
  return mode === "system" ? systemMode : mode;
}
