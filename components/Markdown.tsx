import dynamic from "next/dynamic";

const Markdown = dynamic(() => import("components/MarkdownNoSSR"), {
  ssr: false,
});

export default Markdown;

export { increaseMarkdownHeaderLevel } from "./MarkdownNoSSR";
