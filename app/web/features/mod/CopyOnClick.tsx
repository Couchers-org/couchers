import React from "react";

export default function CopyOnClick({ text }: { text: string }) {
  return (
    <span onClick={() => navigator.clipboard.writeText(text)}>{text}</span>
  );
}
