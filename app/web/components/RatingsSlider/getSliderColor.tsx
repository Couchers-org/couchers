import { Theme } from "@mui/material";
import { colorStringToHsl } from "utils/color";
import { lerp } from "utils/math";

export const getSliderColor = (value: number | undefined, theme: Theme) => {
  const goodHsl = colorStringToHsl(theme.palette.success.main);
  const badHsl = colorStringToHsl(theme.palette.error.main);

  if (value === undefined) {
    return theme.palette.grey[100];
  }

  const interpolatedHsl = badHsl.map((v, index) =>
    lerp(v, goodHsl[index], value),
  );

  return `hsl(${interpolatedHsl[0]}, ${interpolatedHsl[1]}%, ${interpolatedHsl[2]}%)`;
};
