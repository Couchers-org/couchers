import "codemirror/lib/codemirror.css";
import "@toast-ui/editor/dist/toastui-editor.css";

import { makeStyles } from "@material-ui/core";
import ToastUIEditor from "@toast-ui/editor";
import { useEffect, useRef } from "react";
import { Control, useController } from "react-hook-form";

const useStyles = makeStyles((theme) => ({
  root: {
    "& .tui-editor-contents": {
      fontSize: theme.typography.fontSize,
      fontFamily: theme.typography.fontFamily,
      "& h1": {
        borderBottom: "none",
        ...theme.typography.h1,
      },
      "& h2": {
        borderBottom: "none",
        ...theme.typography.h2,
      },
      "& h3": theme.typography.h3,
      "& h4": theme.typography.h4,
      "& h5": theme.typography.h5,
      "& h6": theme.typography.h6,
      "& a": {
        color: theme.palette.primary.main,
      },
    },
  },
}));

interface MarkdownInputProps {
  control: Control;
  defaultValue?: string;
  id: string;
  labelId: string;
  name: string;
}

export default function MarkdownInput({
  control,
  defaultValue,
  id,
  labelId,
  name,
}: MarkdownInputProps) {
  const classes = useStyles();
  const { field } = useController({
    name,
    control,
    defaultValue: defaultValue ?? "",
  });

  const rootEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    field.ref.current = new ToastUIEditor({
      el: rootEl.current!,
      events: {
        blur: () => field.onBlur(),
        change: () =>
          field.onChange((field.ref.current as ToastUIEditor).getMarkdown()),
      },
      initialEditType: "wysiwyg",
      initialValue: defaultValue ?? "",
      usageStatistics: false,
      toolbarItems: [
        "heading",
        "bold",
        "italic",
        "strike",
        "divider",
        "hr",
        "quote",
        "ul",
        "ol",
        "divider",
        "link",
      ],
    });
    const editBox = document.querySelector(`#${id} [contenteditable=true]`);
    if (editBox) {
      editBox.setAttribute("aria-labelledby", labelId);
      editBox.setAttribute("aria-multiline", "true");
      editBox.setAttribute("role", "textbox");
    } else {
      console.warn(
        "Couldn't locate the markdown input area for accessibility tags"
      );
    }

    return () => (field.ref.current as ToastUIEditor).remove();
  }, [defaultValue, field, id, labelId]);

  return <div className={classes.root} ref={rootEl} id={id} />;
}
