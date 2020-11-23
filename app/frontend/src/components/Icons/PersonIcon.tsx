import React from "react";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeopleOutlined";
import { IconProps } from ".";

export function PersonIcon({ titleAccess }: IconProps) {
  return <EmojiPeopleIcon titleAccess={titleAccess} />;
}
