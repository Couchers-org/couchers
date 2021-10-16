import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import LandingScreen from "./components/LandingScreen";
import StorybookUIRoot from "./storybook";

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={{
          position: "absolute",
          top: 30,
          right: 10,
          backgroundColor: "red",
          zIndex: 99,
          borderRadius: 25,
        }}
      >
        <Text
          style={{
            height: 20,
            width: 20,
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {isOpen ? "X" : "SB"}
        </Text>
      </TouchableOpacity>
      <StatusBar style="auto" />
      {isOpen ? (
        <View style={{ width: "100%", height: "100%" }}>
          <StorybookUIRoot />
        </View>
      ) : (
        <LandingScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
