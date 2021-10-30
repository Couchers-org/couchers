import { theme } from "theme";

const goodRatingRed = parseInt(theme.palette.success.main.substring(1, 3), 16);
const goodRatingGreen = parseInt(
  theme.palette.success.main.substring(3, 5),
  16
);
const goodRatingBlue = parseInt(theme.palette.success.main.substring(5, 7), 16);
const badRatingRed = parseInt(theme.palette.error.main.substring(1, 3), 16);
const badRatingGreen = parseInt(theme.palette.error.main.substring(3, 5), 16);
const badRatingBlue = parseInt(theme.palette.error.main.substring(5, 7), 16);

export const getSliderColor = (value: number) => {
  const r = Math.ceil(goodRatingRed * value + badRatingRed * (1 - value));
  const g = Math.ceil(goodRatingGreen * value + badRatingGreen * (1 - value));
  const b = Math.ceil(goodRatingBlue * value + badRatingBlue * (1 - value));

  const rgb = `rgb(${r}, ${g}, ${b})`;

  return rgb;
};
