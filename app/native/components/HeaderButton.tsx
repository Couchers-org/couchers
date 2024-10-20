import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';

const styles = StyleSheet.create({
  root: {
    borderRadius: 20,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 1,
    // shadowRadius: 1,
    elevation: 2,
    padding: 10,
  },
});

interface HeaderButtonProps {
  children?: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export default function HeaderButton({
  children,
  onPress,
  style,
  ...otherProps
}: HeaderButtonProps) {
  return (
    <TouchableOpacity
      {...otherProps}
      onPress={onPress}
      style={[styles.root, style]}
    >
      {children}
    </TouchableOpacity>
  );
}
