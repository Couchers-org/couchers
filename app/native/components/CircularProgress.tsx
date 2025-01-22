import React, { forwardRef } from 'react';
import { ActivityIndicator, View, StyleSheet, ViewStyle } from 'react-native';

interface CircularProgressProps {
  size?: number | 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

const CircularProgress = forwardRef<View, CircularProgressProps>(
  ({ size = 'large', color = '#1976d2', style }, ref) => {
    return (
      <View style={[styles.container, style]} ref={ref}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CircularProgress;
