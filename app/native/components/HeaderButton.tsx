import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

const styles = StyleSheet.create({
  root: {
    borderRadius: 20,
    elevation: 7,
    shadowOffset: { width: 1, height: 1 },
    shadowRadius: 3,
    shadowOpacity: 0.5,
  },
});

interface HeaderButtonProps {
  children?: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export default function HeaderButton({
  children,
  onPress,
  style,
  accessibilityLabel,
  ...otherProps
}: HeaderButtonProps) {
  return (
    <TouchableOpacity
      {...otherProps}
      onPress={onPress}
      style={[styles.root, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </TouchableOpacity>
  );
}
