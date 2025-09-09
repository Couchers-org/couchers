const stringOrFirstString = (str: string | string[] | undefined) => {
  return typeof str === "object" ? str[0] : str;
};

export default stringOrFirstString;
