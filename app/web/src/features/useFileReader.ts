import * as Sentry from "@sentry/react";
import { useRef, useState } from "react";

export default function useFileReader({
  COULDNT_READ_FILE,
}: {
  COULDNT_READ_FILE: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [readerError, setReaderError] = useState("");

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setReaderError("");
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    try {
      setFile(file);
    } catch (e) {
      Sentry.captureException(
        new Error((e as ProgressEvent<FileReader>).toString()),
        {
          tags: {
            component: "features/useFileReader",
          },
        }
      );
      setReaderError(COULDNT_READ_FILE);
    }
  };

  //without this, onChange is not fired when the same file is selected after cancelling
  const inputRef = useRef<HTMLInputElement>(null);
  const handleClick = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const resetReader = () => setFile(null);

  return {
    ref: inputRef,
    onClick: handleClick,
    onChange: handleChange,
    readerError,
    file,
    resetReader,
  };
}
