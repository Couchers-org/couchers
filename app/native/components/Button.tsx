import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { ThemedText } from "./ThemedText";

interface ButtonProps {
  title: string;
  filled?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  title,
  filled = false,
  onPress,
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        filled ? styles.filledButton : styles.transparentButton,
        disabled ? styles.disabledButton : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : (
        <ThemedText
          type="button"
          style={[
            styles.buttonText,
            filled ? styles.filledButtonText : styles.transparentButtonText,
          ]}
        >
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  filledButton: {
    backgroundColor: "#00A398",
  },
  disabledButton: {
    backgroundColor: "#E6EBEA",
  },

  transparentButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#00A398",
  },
  buttonText: {
    fontWeight: "bold",
  },
  filledButtonText: {
    color: "white",
  },
  transparentButtonText: {
    color: "#00A398",
  },
});
