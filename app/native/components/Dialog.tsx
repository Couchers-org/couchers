import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Dialog as PaperDialog,
  Portal,
  DialogTitleProps,
  DialogActionsProps,
  DialogContentProps,
} from "react-native-paper";

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    paddingTop: 0,
  },
  content: {
    padding: 24,
    width: "100%",
  },
  contentText: {
    padding: 16,
  },
  title: {
    padding: 16,
    paddingBottom: 0,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 8,
    top: 8,
  },
});

export interface DialogProps {
  visible: boolean;
  onDismiss: () => void;
}

export function Dialog(props: DialogProps & { children: React.ReactNode }) {
  return (
    <Portal>
      <PaperDialog
        visible={props.visible}
        onDismiss={props.onDismiss}
        style={{ backgroundColor: "white" }}
      >
        {props.children}
      </PaperDialog>
    </Portal>
  );
}

export function DialogActions(props: DialogActionsProps) {
  return <PaperDialog.Actions {...props} style={styles.actions} />;
}

export function DialogContent(props: DialogContentProps) {
  return <PaperDialog.Content {...props} style={styles.content} />;
}

export function DialogContentText(props: DialogContentProps) {
  return (
    <DialogContent style={styles.contentText}>
      <Text>{props.children}</Text>
    </DialogContent>
  );
}

export function DialogTitle({
  children,
  onClose,
  ...dialogTitleProps
}: DialogTitleProps & { onClose?: () => void }) {
  return (
    <View {...dialogTitleProps} style={styles.title}>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="gray" />
        </TouchableOpacity>
      )}
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>{children}</Text>
    </View>
  );
}
