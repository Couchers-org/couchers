import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

interface LinkProps {
  onPress: () => void;
  children?: string;
  style?: object;
}

const Link: React.FC<LinkProps> = ({ onPress, children, style }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={[styles.link, style]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  link: {
    color: '#00A398',
    textDecorationLine: 'underline',
  },
});

export default Link;
