import { ConnectError } from "@connectrpc/connect";
import { TFunction } from "next-i18next";
import { useCallback, useState } from "react";

export const getErrorMessage = (error: unknown, t: TFunction) => {
  if (!error) {
    return undefined;
  }

  if (error instanceof ConnectError) {
    return error.rawMessage;
  }

  return error instanceof Error
    ? error.message
    : t("global:error.fatal_message");
};

export const useErrorMessage = (t: TFunction) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const setError = useCallback(
    (error: unknown) => {
      setErrorMessage(getErrorMessage(error, t));
    },
    [t],
  );

  return { errorMessage, setError };
};
