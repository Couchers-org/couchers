import "@toast-ui/editor/dist/toastui-editor.css";

import ToastUIEditor from "@toast-ui/editor";
import { ToolbarItem } from "@toast-ui/editor/types/ui";
import { INSERT_IMAGE } from "components/MarkdownInput/constants";
import UploadImage from "components/MarkdownInput/UploadImage";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { Control, useController } from "react-hook-form";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    "& .toastui-editor-contents": {
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
    "& .toastui-editor-md-mode .toastui-editor-md-container, & .toastui-editor-ww-mode .toastui-editor-ww-container":
      {
        zIndex: "unset",
      },
  },
}));

export interface MarkdownInputProps {
  control: Control;
  defaultValue?: string;
  id: string;
  resetInputRef?: MutableRefObject<ToastUIEditor["reset"] | null>;
  labelId: string;
  name: string;
  imageUpload?: boolean;
  required?: string;
}

export default function MarkdownInput({
  control,
  defaultValue,
  id,
  resetInputRef,
  labelId,
  name,
  imageUpload = false,
  required,
}: MarkdownInputProps) {
  const classes = useStyles();
  const { field } = useController({
    name,
    control,
    defaultValue: defaultValue ?? "",
    rules: {
      required,
    },
  });

  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const initialDefaultValue = useRef(defaultValue);
  const { ref: fieldRef }: { ref: MutableRefObject<ToastUIEditor> } = field;

  const rootEl = useRef<HTMLDivElement>(null);

  // Workaround to keep the function identities of onBlur/onChange stable to
  // prevent the effect below from re-running and destroying the editor instance
  const fieldOnBlur = useRef<typeof field.onBlur>(field.onBlur);
  const fieldOnChange = useRef<typeof field.onChange>(field.onChange);

  useEffect(() => {
    const uploadButton = imageUpload ? document.createElement("button") : null;
    const openDialog = () => {
      setImageDialogOpen(true);
    };

    if (imageUpload) {
      uploadButton!.type = "button";
      //class stolen from tui source code
      uploadButton!.className = "toastui-editor-toolbar-icons image";
      uploadButton!.setAttribute("aria-label", INSERT_IMAGE);
      uploadButton!.style.margin = "0";
      uploadButton!.addEventListener("click", openDialog);
    }
    const toolbarItems: ToolbarItem[] = [
      ["heading", "bold", "italic"],
      ["hr", "quote", "ul", "ol"],
      ["link"],
    ];
    if (imageUpload) {
      toolbarItems.push([
        {
          name: "image",
          tooltip: INSERT_IMAGE,
          el: uploadButton!,
        },
      ]);
    }
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
      toolbarItems,
    });

    if (resetInputRef) {
      resetInputRef.current = fieldRef.current.reset.bind(fieldRef.current);
    }

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

    return () => {
      if (resetInputRef) {
        resetInputRef.current = null;
      }
      if (imageUpload) uploadButton!.removeEventListener("click", openDialog);
      (fieldRef.current as ToastUIEditor).destroy();
    };
  }, [fieldRef, resetInputRef, id, labelId, imageUpload]);

  return (
    <>
      <div className={classes.root} ref={rootEl} id={id} />
      {imageUpload && (
        <UploadImage
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          emitter={
            (fieldRef.current as ToastUIEditor | undefined)?.eventEmitter
          }
        />
      )}
    </>
  );
}
