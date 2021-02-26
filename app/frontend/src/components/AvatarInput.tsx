import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";
import makeStyles from "@material-ui/core/styles/makeStyles";
import classNames from "classnames";
import React, { useState } from "react";

import { ImageInput, ImageInputProps, ImageInputValues } from "./ImageInput";

const useStyles = makeStyles(() => ({
  avatar: {
    "& img": { objectFit: "contain" },
  },
}));

export interface AvatarInputProps
  extends Omit<ImageInputProps, "children" | "onChange"> {
  src?: string;
  onChange: (key: string) => void;
  className?: string;
  username?: string;
}

export function AvatarInput({
  id,
  name,
  src,
  username,
  className,
  onChange,
  ...rest
}: AvatarInputProps) {
  const classes = useStyles();
  const [imageUrl, setImageUrl] = useState(src);
  const handleChange = (values: ImageInputValues) => {
    const randomInt = Math.floor(Math.random() * 100); // force reload onChange
    setImageUrl(values.thumbnail_url + "?rand=" + randomInt);
    onChange && onChange(values.key);
  };

  return (
    <ImageInput id={id} name={name} onChange={handleChange} {...rest}>
      <IconButton component="span">
        <Avatar
          className={classNames(classes.avatar, className)}
          src={imageUrl}
          alt={id + " avatar"}
        >
          {username}
        </Avatar>
      </IconButton>
    </ImageInput>
  );
}

export default AvatarInput;
