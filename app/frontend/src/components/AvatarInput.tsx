import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";
import React from "react";

import {ImageInput, ImageInputProps} from "./ImageInput";

export interface AvatarInputProps extends ImageInputProps {
    src?: string;
    username?: string;
}

const AvatarInput: React.FC<AvatarInputProps> = ({id, name, username, src, ...rest}) => {
    return (
        <ImageInput id={id} name={name} {...rest}>
            <IconButton component="span">
                <Avatar
                    src={src}
                    imgProps={{style: {objectFit: 'contain'}}}
                    style={{height: 120, width: 120, objectFit: 'contain'}}
                    alt={id + ' avatar'}
                >
                    {username}
                </Avatar>
            </IconButton>
        </ImageInput>
    )
}

export default AvatarInput;
