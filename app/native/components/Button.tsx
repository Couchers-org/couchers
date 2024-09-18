import { Pressable, StyleSheet } from "react-native";
import { ThemedText } from "./ThemedText";

interface ButtonProps {
  title: string;
  filled?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export default function Button({
  title,
  filled = false,
  onPress,
  disabled = false,
}: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        filled ? styles.filledButton : styles.transparentButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <ThemedText
        type="button"
        style={[
          styles.buttonText,
          filled ? styles.filledButtonText : styles.transparentButtonText,
        ]}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  filledButton: {
    backgroundColor: "#00A398",
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
