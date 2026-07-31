import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";

import { styled } from "@mui/material";
import ToastUIEditor from "@toast-ui/editor";
import { ToolbarItem } from "@toast-ui/editor/types/ui";
import { INSERT_IMAGE } from "components/MarkdownInput/constants";
import UploadImage from "components/MarkdownInput/UploadImage";
import { useEffect, useRef, useState } from "react";
import { useController } from "react-hook-form";
import { useIsNativeEmbed } from "utils/nativeLink";
import useResolvedColorScheme from "utils/useResolvedColorScheme";

import { MarkdownInputProps } from "./MarkdownInput";

const StyledWrapper = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "isErrorState" && prop !== "isNativeEmbed",
})<{ isErrorState: boolean; isNativeEmbed: boolean }>(
  ({ theme, isErrorState, isNativeEmbed }) => ({
    ...(isNativeEmbed && {
      minWidth: 0,
      "& .toastui-editor-toolbar": {
        overflowX: "auto",
      },
    }),
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
        color: "var(--mui-palette-primary-main)",
      },
      "& img": {
        width: "100%",
        maxWidth: "400px",
      },
    },
    // Fix link popup positioning on mobile
    "& .toastui-editor-defaultUI": {
      position: "relative",
    },
    "& .toastui-editor-popup": {
      [theme.breakpoints.down("md")]: {
        left: "0 !important",
        right: "0 !important",
        marginLeft: "auto",
        marginRight: "auto",
        maxWidth: "calc(100vw - 48px)",
        width: "auto !important",
      },
    },
    ...(isErrorState && {
      "& .toastui-editor-defaultUI": {
        border: "2px solid red",
      },
    }),
  }),
);

const StyledErrorText = styled("div")(({ theme }) => ({
  color: "var(--mui-palette-error-main)",
  marginTop: theme.spacing(0.25),
  fontSize: "0.875rem",
}));

export default function MarkdownInput({
  control,
  defaultValue,
  id,
  resetInputRef,
  labelId,
  name,
  imageUpload = false,
  autofocus = false,
  required,
  placeholder,
}: MarkdownInputProps) {
  const resolvedMode = useResolvedColorScheme();
  const isNativeEmbed = useIsNativeEmbed();
  const { field, fieldState } = useController({
    name,
    control,
    defaultValue: defaultValue ?? "",
    rules: {
      required,
      validate: (value) => {
        const trimmedValue = value.trim();
        if (trimmedValue.length === 0) {
          return required;
        }
        return true;
      },
    },
  });

  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const fieldRef = useRef<ToastUIEditor | null>(null); // Separate ref for the editor
  const currentContent = useRef(defaultValue ?? ""); // Store current content to preserve across theme changes

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
        change: () => {
          const markdown = (fieldRef.current as ToastUIEditor).getMarkdown();
          currentContent.current = markdown; // Save current content
          fieldOnChange.current(markdown);
        },
      },
      initialEditType: "wysiwyg",
      initialValue: currentContent.current, // Use preserved content instead of initial default
      placeholder,
      usageStatistics: false,
      toolbarItems,
      autofocus,
      extendedAutolinks: true,
      theme: resolvedMode === "dark" ? "dark" : "light",
    });

    if (resetInputRef) {
      resetInputRef.current = fieldRef.current.reset.bind(fieldRef.current);
    }

    const editBox = document.querySelector(
      `#${id} [contenteditable=true]`,
    ) as HTMLElement | null;
    if (editBox) {
      editBox.setAttribute("aria-labelledby", labelId);
      editBox.setAttribute("aria-multiline", "true");
      editBox.setAttribute("role", "textbox");
    } else {
      console.warn(
        "Couldn't locate the markdown input area for accessibility tags",
      );
    }

    // Samsung/Android WebView: after blur, tapping a contenteditable again
    // doesn't reconnect the IME (keyboard). Explicit focus() on touchstart fixes it.
    const handleTouchStart = () => editBox?.focus();
    editBox?.addEventListener("touchstart", handleTouchStart);

    return () => {
      editBox?.removeEventListener("touchstart", handleTouchStart);
      // Save current content before destroying the editor
      if (fieldRef.current) {
        currentContent.current = (
          fieldRef.current as ToastUIEditor
        ).getMarkdown();
      }
      if (resetInputRef) {
        resetInputRef.current = null;
      }
      if (imageUpload) uploadButton!.removeEventListener("click", openDialog);
      (fieldRef.current as ToastUIEditor).destroy();
    };
  }, [
    autofocus,
    fieldRef,
    resetInputRef,
    id,
    labelId,
    imageUpload,
    placeholder,
    resolvedMode,
  ]);

  return (
    <>
      <StyledWrapper
        ref={rootEl}
        id={id}
        isErrorState={fieldState.invalid}
        isNativeEmbed={isNativeEmbed}
      />
      {imageUpload && (
        <UploadImage
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          emitter={
            (fieldRef.current as ToastUIEditor | undefined)?.eventEmitter
          }
        />
      )}
      {fieldState.error && (
        <StyledErrorText data-testid="markdown-error-text">
          {fieldState.error.message}
        </StyledErrorText>
      )}
    </>
  );
}
