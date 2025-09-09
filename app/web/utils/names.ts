export const firstName = (fullName?: string) => {
  return fullName?.split(" ")[0] ?? "";
};
