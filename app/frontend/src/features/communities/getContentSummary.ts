import stripMarkdown from "utils/stripMarkdown";

export default function getContentSummary({
  maxLength,
  originalContent,
}: {
  maxLength: number;
  originalContent?: string;
}) {
  if (originalContent) {
    const strippedText = stripMarkdown(originalContent.replace("\n", " "));
    return strippedText.length > maxLength
      ? strippedText.substring(0, maxLength) + "..."
      : strippedText;
  }
  return "";
}
