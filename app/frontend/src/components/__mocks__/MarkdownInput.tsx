import { useState } from "react";
import { useController } from "react-hook-form";

import { MarkdownInputProps } from "../MarkdownInput";

export default function MarkdownInputMock({
  control,
  id,
  labelId,
  name,
  defaultValue,
}: MarkdownInputProps) {
  const [value, setValue] = useState(defaultValue ?? "");

  const { field } = useController({
    name,
    control,
    defaultValue: defaultValue ?? "",
  });
  const { ref, onBlur, onChange } = field;

  return (
    <input
      aria-labelledby={labelId}
      id={id}
      name={name}
      type="text"
      onBlur={onBlur}
      onChange={(e) => {
        setValue(e.target.value);
        onChange(e);
      }}
      ref={ref}
      value={value}
    />
  );
}
