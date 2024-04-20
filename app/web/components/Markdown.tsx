import dynamic from "next/dynamic";

const Markdown = dynamic(() => import("components/MarkdownNoSSR"), {
  ssr: false,
});

export default Markdown;

export function increaseMarkdownHeaderLevel(
  source: string,
  topHeaderLevel: number
) {
  let convertedSource = source;
  for (let i = 6; i >= 1; i--) {
    //loop through each header level, and add extra # as necessary
    //also put a ~ in front so we know that line is done
    convertedSource = convertedSource.replace(
      new RegExp(`^${"#".repeat(i)}`, "gm"),
      `~${"#".repeat(Math.min(i + topHeaderLevel - 1, 6))}`
    );
  }
  //take out the ~ markers (line start only)
  return convertedSource.replace(/^~#/gm, "#");
}
