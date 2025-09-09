export const getErrorMessage = (error: unknown) => {
  if (!error) {
    return undefined;
  }

  return error instanceof Error ? error.message : "Unknown error";
};
