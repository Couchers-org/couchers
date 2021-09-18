import React from "react";
import PropTypes from "prop-types";
import { TouchableHighlight } from "react-native";

export default function Button({ onPress, children }: {onPress: any, children: any}) {
  return <TouchableHighlight onPress={onPress}>{children}</TouchableHighlight>;
}

Button.defaultProps = {
  children: null,
  onPress: () => {},
};

Button.propTypes = {
  children: PropTypes.node,
  onPress: PropTypes.func,
};
