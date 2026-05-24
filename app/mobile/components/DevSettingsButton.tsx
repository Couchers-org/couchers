import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef } from "react";
import { Animated, PanResponder, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isDevUrlOverrideEnabled } from "@/config/urls";
import { theme } from "@/theme";

// Draggable floating button that opens the developer URL-override screen from
// anywhere in the app. Rendered above the navigator (and its webviews) so it's
// reachable on every screen, logged in or out. Non-prod builds only.
export default function DevSettingsButton() {
  const insets = useSafeAreaInsets();
  const pan = useRef(new Animated.ValueXY()).current;
  const draggedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        draggedRef.current = false;
        pan.extractOffset();
      },
      onPanResponderMove: (evt, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
          draggedRef.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(evt, gesture);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        // A press that didn't move is a tap → open the screen.
        if (!draggedRef.current) {
          router.navigate("/dev-settings");
        }
      },
    }),
  ).current;

  if (!isDevUrlOverrideEnabled()) {
    return null;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel="Open developer settings"
      style={[
        styles.button,
        { bottom: insets.bottom + 96, transform: pan.getTranslateTransform() },
      ]}
    >
      <Ionicons name="construct" size={20} color="#fff" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.secondary.main,
    opacity: 0.85,
    zIndex: 1000,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
