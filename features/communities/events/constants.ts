export const details = ({ colon = false }: { colon?: boolean } = {}) =>
  `Details${colon ? ":" : ""}`;
export const getExtraAvatarCountText = (count: number) => `+${count}`;
