import { Link as MuiLink } from "@material-ui/core";
import React from "react";

const urlRegex = () => {
  const protocol = `(?:https?://)?`;
  const auth = "(?:\\S+(?::\\S*)?@)?";
  const host = "(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)";
  const domain =
    "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*";
  const tld = `(?:\\.)[a-z]{2,}`;
  const path = '(?:[/?#][^\\s"]*)?';
  const regex = `(?:${protocol}${auth}(?:${host}${domain}${tld})${path})`;
  const result = new RegExp(`(${regex})`, "ig");
  return result;
};

interface LinkifyProps {
  text: string;
}

function Linkify({ text }: LinkifyProps) {
  const nonCapturingRegex = urlRegex();
  const parts = text.split(nonCapturingRegex);

  const result = parts.map((part, i) => {
    if (!part || !part.match) {
      return null;
    }
    if (part.match(nonCapturingRegex)) {
      // Exclude email addresses
      if (part.includes("@") && !part.includes("/")) {
        return <React.Fragment key={i}>{part}</React.Fragment>;
      }
      const href = part.endsWith(".") ? part.slice(0, -1) : part;
      const protocolPrefix = part.match(/https?:?\/\//) ? "" : "//";
      return (
        <MuiLink
          key={i}
          target="_blank"
          rel="noreferrer"
          href={`${protocolPrefix}${href}`}
        >
          {part}
        </MuiLink>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

  return <>{result}</>;
}

export default Linkify;
