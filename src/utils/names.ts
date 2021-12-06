export function firstName(fullName?: string) {
  return fullName?.split(" ")[0] ?? "";
}

export function acronym(name?: string) {
  return name?.trim()?.slice(0, 1).toUpperCase();
}
