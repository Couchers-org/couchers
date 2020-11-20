import React from "react";
import CakeIcon from "@material-ui/icons/CakeOutlined";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeopleOutlined";
import TranslateIcon from "@material-ui/icons/TranslateOutlined";
import LocationIcon from "@material-ui/icons/LocationOnOutlined";
import WorkIcon from "@material-ui/icons/WorkOffOutlined";

interface IconProps {
  type: "cake" | "gender" | "location" | "language" | "work";
  titleAccess: string;
}

export default function Icon({ type, titleAccess }: IconProps) {
  switch (type) {
    case "cake":
      return <CakeIcon titleAccess={titleAccess} />;
    case "gender":
      return <EmojiPeopleIcon titleAccess={titleAccess} />;
    case "location":
      return <LocationIcon titleAccess={titleAccess} />;
    case "language":
      return <TranslateIcon titleAccess={titleAccess} />;
    case "work":
      return <WorkIcon titleAccess={titleAccess} />;
  }
}
