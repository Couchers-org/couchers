import React from "react";
import WebEmbed from "@/components/WebEmbed";
import { useLocalSearchParams } from "expo-router";

export default function MarkdownEmbed() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slugParam = params.slug;

  const segments = Array.isArray(slugParam)
    ? slugParam
    : typeof slugParam === "string"
      ? [slugParam]
      : [];

  const path = "/" + segments.join("/");

  return <WebEmbed path={path} />;
}
