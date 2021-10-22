import classNames from "classnames";
import React from "react";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => {
  return {
    a: {
      color: theme.palette.primary.main,
    },
  };
});

const urlRegex = () => {
  /*

  */
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

function Linkify(props: LinkifyProps) {
  const classes = useStyles();
  const nonCapturingRegex = urlRegex();
  const parts = props.text.split(nonCapturingRegex);

  const result = parts.map((part, i) => {
    if (!part || !part.match) {
      return undefined;
    }
    if (part.match(nonCapturingRegex)) {
      // Exclude email addresses
      if (part.includes("@") && !part.includes("/")) {
        return <React.Fragment key={i}>{part}</React.Fragment>;
      }
      const href = part.endsWith(".") ? part.slice(0, -1) : part;
      const protocolPrefix = part.match(/https?:?\/\//) ? "" : "//";
      return (
        <a
          key={i}
          className={classNames(classes.a)}
          target="_blank"
          rel="noreferrer"
          href={`${protocolPrefix}${href}`}
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

  return <>{result}</>;
}

export default Linkify;
