import { useEffect, useState } from "react";

import useFileReader from "./useFileReader";

export const readBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

export default function useImageReader(
  args: Parameters<typeof useFileReader>[0]
) {
  const [base64, setBase64] = useState<string | undefined>(undefined);
  const { file, ...rest } = useFileReader(args);

  useEffect(() => {
    if (!file) {
      return;
    }
    const readAsync = async () => {
      setBase64(await readBase64(file));
    };

    readAsync();
  }, [file]);

  return {
    file,
    base64,
    ...rest,
  };
}
