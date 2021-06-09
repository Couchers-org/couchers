import stripMarkdown from "utils/stripMarkdown";

export default function getContentSummary(originalContent?: string) {
  if (originalContent) {
    const strippedText = stripMarkdown(originalContent.replace("\n", " "));
    return strippedText.length > 300
      ? strippedText.substring(0, 298) + "..."
      : strippedText;
  }
  return "";
}
