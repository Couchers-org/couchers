import React from "react";

export interface ImageInputProps {
    id?: string;
    name?: string;
    onChange: (file: File) => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({id, name, children, onChange}) => {
    const inputId = id + '-file-input';
    return (
        <React.Fragment>
            <input
                accept="image/*"
                style={{display: 'none'}}
                id={inputId}
                name={name}
                type="file"
                onChange={async (event) => {
                    if (!event.target.files?.length) {
                        console.log("No files selected");
                        return;
                    }
                    const file = event.target.files[0];
                    onChange && onChange(file);
                }}
            />
            <label htmlFor={inputId}>
                {children}
            </label>
        </React.Fragment>
    )
}
export default ImageInput;