import dynamic from "next/dynamic";

const MarkdownInput = dynamic(() => import("components/MarkdownNoSSR"), {
  ssr: false,
});

export default MarkdownInput;
