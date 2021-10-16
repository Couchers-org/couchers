import React from "react";
import PropTypes from "prop-types";
import { View, StyleSheet } from "react-native";

export default function CenterView({ children }: { children: React.ReactNode }) {
  return <View style={styles.main}>{children}</View>;
}

CenterView.defaultProps = {
  children: null,
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
    backgroundColor: "#F5FCFF",
  },
})