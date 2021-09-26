import React from "react";
import { StyleSheet, TouchableOpacity, Text, TouchableOpacityProps } from "react-native";
import { COLORS } from "../../constants/colorPalette";

interface ButtonProps {
  title: string;
  onPress: TouchableOpacityProps['onPress'];
  theme?: "primary" | "secondary" | "accent";
  height?: number | string;
  width?: number | string;
  fontSize?: number;
  color?: string;
}

export default function LargeButton({
  title,
  onPress,
  theme,
  height = 50,
  width = "100%",
  fontSize = 20,
  color,
}: ButtonProps) {
  let backgroundColor = theme ? COLORS[theme] : "transparent",
    borderColor = theme ? "transparent" : COLORS["primary"];

  if (!color) {
    color = !theme ? COLORS["primary"] : "#fff";
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, { backgroundColor, borderColor, height, width }]}
    >
      <Text style={{ color, fontSize }}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderStyle: "solid",
    borderWidth: 2,
    borderRadius: 25,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});
