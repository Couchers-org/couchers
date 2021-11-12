import "@toast-ui/editor/dist/toastui-editor-viewer.css";

import ToastUIEditorViewer from "@toast-ui/editor/dist/toastui-editor-viewer";
import classNames from "classnames";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { escapeRegExp } from "utils/escapeRegExp";
import makeStyles from "utils/makeStyles";

interface MarkdownProps {
  className?: string;
  source: string;
  topHeaderLevel?: number;
  allowImages?: "none" | "couchers";
}

const useStyles = makeStyles((theme) => ({
  root: {
    fontSize: theme.typography.fontSize,
    fontFamily: theme.typography.fontFamily,
    "& h1, & h2, & h3, & h4, & h5, & h6, & p": {
      borderBottom: "none",
      paddingBottom: 0,
      marginBottom: 0,
      marginTop: theme.spacing(2),
      overflowWrap: "break-word",
      whiteSpace: "pre-wrap",
    },
    "& h1": theme.typography.h1,
    "& h2": theme.typography.h2,
    "& h3": theme.typography.h3,
    "& h4": theme.typography.h4,
    "& h5": theme.typography.h5,
    "& h6": theme.typography.h6,
    "& p": theme.typography.body1,
    "& ol": theme.typography.body1,
    "& ul": theme.typography.body1,
    "& blockquote": theme.typography.body1,
    "& a": {
      color: theme.palette.primary.main,
    },
    "& img": {
      width: "100%",
      maxWidth: "400px",
      height: "auto",
    },
  },
}));

export default function Markdown({
  className,
  source,
  topHeaderLevel = 2,
  allowImages = "none",
}: MarkdownProps) {
  const classes = useStyles();

  const rootEl = useRef<HTMLDivElement>(null);
  const viewer = useRef<ToastUIEditorViewer>();
  useEffect(() => {
    let sanitizedSource = increaseMarkdownHeaderLevel(source, topHeaderLevel);
    //remove all html except <br>
    sanitizedSource = sanitizedSource.replace(/<(?!br)([^>]+)>/gi, "");
    //change images ![]() to links []()
    sanitizedSource = sanitizedSource.replace(
      allowImages === "couchers"
        ? new RegExp(
            `!(?=\\[.*]\\((?!${escapeRegExp(
              process.env.NEXT_PUBLIC_MEDIA_BASE_URL
            )}).*\\))`,
            "gi"
          )
        : /!(?=\[.*]\(.*\))/gi,
      ""
    );
    viewer.current = new ToastUIEditorViewer({
      el: rootEl.current!,
      initialValue: sanitizedSource,
      extendedAutolinks: true,
    });
    return () => viewer.current?.destroy();
  }, [source, topHeaderLevel, allowImages]);

  return <div className={classNames(className, classes.root)} ref={rootEl} />;
}

export function increaseMarkdownHeaderLevel(
  source: string,
  topHeaderLevel: number
) {
  let convertedSource = source;
  for (let i = 6; i >= 1; i--) {
    //loop through each header level, and add extra # as necessary
    //also put a ~ in front so we know that line is done
    convertedSource = convertedSource.replace(
      new RegExp(`^${"#".repeat(i)}`, "gm"),
      `~${"#".repeat(Math.min(i + topHeaderLevel - 1, 6))}`
    );
  }
  //take out the ~ markers (line start only)
  return convertedSource.replace(/^~#/gm, "#");
}
