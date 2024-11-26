import React from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from './ThemedText';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    marginTop: 4,
  },
  flexItem: {
    flex: 1,
    flexBasis: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginRight: 8,
  },
});

export interface LabelAndTextProps {
  label: string;
  text: string | React.ReactNode;
}

export default function LabelAndText({ label, text }: LabelAndTextProps) {
  return (
    <View style={styles.root}>
      <View style={styles.flexItem}>
        <ThemedText type="defaultSemiBold" style={styles.label}>{label}</ThemedText>
      </View>
      <View style={styles.flexItem}>
        <ThemedText type="default">{text}</ThemedText>
      </View>
    </View>
  );
}
