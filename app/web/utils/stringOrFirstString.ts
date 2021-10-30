export default function stringOrFirstString(
  str: string | string[] | undefined
) {
  return typeof str === "object" ? str[0] : str;
}
