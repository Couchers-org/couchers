import "codemirror/lib/codemirror.css";
import "@toast-ui/editor/dist/toastui-editor.css";

import ToastUIEditor from "@toast-ui/editor";
import { useEffect, useRef } from "react";
import { Control, useController } from "react-hook-form";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    "& .tui-editor-contents": {
      fontSize: theme.typography.fontSize,
      fontFamily: theme.typography.fontFamily,
      "& h1, & h2, & h3, & h4, & h5, & h6": {
        borderBottom: "none",
        paddingBottom: 0,
        marginBottom: 0,
        marginTop: theme.spacing(2),
      },
      "& h1": {
        ...theme.typography.h1,
      },
      "& h2": {
        ...theme.typography.h2,
      },
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
      },
    },
  },
}));

export interface MarkdownInputProps {
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

  const initialDefaultValue = useRef(defaultValue);
  const { ref: fieldRef } = field;

  const rootEl = useRef<HTMLDivElement>(null);

  // Workaround to keep the function identities of onBlur/onChange stable to
  // prevent the effect below from re-running and destroying the editor instance
  const fieldOnBlur = useRef<typeof field.onBlur>(field.onBlur);
  const fieldOnChange = useRef<typeof field.onChange>(field.onChange);

  useEffect(() => {
    fieldRef.current = new ToastUIEditor({
      el: rootEl.current!,
      events: {
        blur: () => fieldOnBlur.current(),
        change: () =>
          fieldOnChange.current(
            (fieldRef.current as ToastUIEditor).getMarkdown()
          ),
      },
      initialEditType: "wysiwyg",
      initialValue: initialDefaultValue.current ?? "",
      usageStatistics: false,
      toolbarItems: [
        "heading",
        "bold",
        "italic",
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

    return () => (fieldRef.current as ToastUIEditor).remove();
  }, [fieldRef, id, labelId]);

  return <div className={classes.root} ref={rootEl} id={id} />;
}
