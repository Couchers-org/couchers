import { isNativeEmbed, openExternalUrl } from "utils/nativeLink";

// Triggers downloading the file at url on web, or letting the mobile native shell handle it.
export function downloadAtURL(url: string, filename: string) {
  if (isNativeEmbed()) {
    openExternalUrl(url);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.click();
}
