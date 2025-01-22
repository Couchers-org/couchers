import React from "react";
import { TextProps } from "react-native";
import { ThemedText } from "./ThemedText";

export default function TextBody(props: TextProps) {
  return <ThemedText type="default" {...props} style={[props.style]} />;
}
