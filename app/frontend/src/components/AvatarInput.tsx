import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";
import makeStyles from "@material-ui/core/styles/makeStyles";
import classNames from "classnames";
import React from "react";

import { ImageInput, ImageInputProps } from "./ImageInput";

const useStyles = makeStyles(() => ({
  avatar: {
    "& img": { objectFit: "contain" },
  },
}));

export interface AvatarInputProps extends Omit<ImageInputProps, "children"> {
  src?: string;
  className?: string;
  username?: string;
}

export function AvatarInput({
  id,
  name,
  src,
  username,
  className,
  ...rest
}: AvatarInputProps) {
  const classes = useStyles();

  return (
    <ImageInput id={id} name={name} {...rest}>
      <IconButton component="span">
        <Avatar
          className={classNames(classes.avatar, className)}
          src={src}
          alt={id + " avatar"}
        >
          {username}
        </Avatar>
      </IconButton>
    </ImageInput>
  );
}

export default AvatarInput;
