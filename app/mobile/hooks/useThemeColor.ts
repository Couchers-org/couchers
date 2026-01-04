/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useColorScheme } from "react-native";

import { theme } from "@/theme";

type ColorName = "text" | "background" | "icon";

const colorMap = {
  light: {
    text: theme.palette.text.primary,
    background: theme.palette.background.default,
    icon: theme.palette.grey[100],
  },
  dark: {
    text: theme.dark.text.primary,
    background: theme.dark.background.default,
    icon: theme.dark.grey[100],
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorName,
) {
  const scheme = useColorScheme() ?? "light";
  const colorFromProps = props[scheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return colorMap[scheme][colorName];
  }
}
