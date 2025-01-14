import { grpcErrorStrings, ObscureGrpcErrorMessages } from "@/appConstants";
import React, { ReactNode, useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Snackbar as PaperSnackbar } from "react-native-paper";

const styles = StyleSheet.create({
  snackbar: {
    position: "absolute",
    top: 0,
    width: "100%",
  },
  content: {
    padding: 10,
    borderRadius: 4,
  },
  success: {
    backgroundColor: "#4caf50",
  },
  error: {
    backgroundColor: "#f44336",
  },
  text: {
    color: "white",
  },
});

export interface SnackbarProps {
  children: ReactNode;
  severity: "success" | "error";
}

export default function Snackbar({ children, severity }: SnackbarProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const oldErrorKey =
    typeof children === "string"
      ? Object.keys(grpcErrorStrings).find<ObscureGrpcErrorMessages>(
          (oldError): oldError is ObscureGrpcErrorMessages =>
            children.includes(oldError)
        )
      : null;

  const message = oldErrorKey ? grpcErrorStrings[oldErrorKey] : children;

  return (
    <PaperSnackbar
      visible={visible}
      onDismiss={() => setVisible(false)}
      duration={8000}
      style={styles.snackbar}
    >
      <View style={[styles.content, styles[severity]]}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </PaperSnackbar>
  );
}
