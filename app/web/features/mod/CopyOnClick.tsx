import React from "react";

const CopyOnClick = ({ text }: { text: string }) => {
  return (
    <span onClick={() => void navigator.clipboard.writeText(text)}>{text}</span>
  );
};
export default CopyOnClick;
