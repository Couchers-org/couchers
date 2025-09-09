export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";
