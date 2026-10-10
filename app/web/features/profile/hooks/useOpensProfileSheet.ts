import { useIsNativeEmbed } from "utils/nativeLink";
import useIsScreenSizeOrSmaller from "utils/useIsScreenSizeOrSmaller";

export default function useOpensProfileSheet(): boolean {
  const isNativeEmbed = useIsNativeEmbed();
  const isMobile = useIsScreenSizeOrSmaller("mobile");
  return isNativeEmbed || isMobile;
}
