import React from "react";
import TranslateIcon from "@material-ui/icons/TranslateOutlined";
import { IconProps } from ".";

export function LanguageIcon({ titleAccess }: IconProps) {
  return <TranslateIcon titleAccess={titleAccess} />;
}
