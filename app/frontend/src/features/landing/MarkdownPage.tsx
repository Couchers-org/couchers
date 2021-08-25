import Markdown from "components/Markdown";
import PageTitle from "components/PageTitle";
import { GrayMatterFile } from "gray-matter";
import makeStyles from "utils/makeStyles";

const useStyles = makeStyles((theme) => {});

export default function MarkdownPage({ file }: { file: GrayMatterFile<any> }) {
  const classes = useStyles();

  return (
    <>
      {file.data.title && <PageTitle>{file.data.title}</PageTitle>}
      <Markdown source={file.data.content} />
    </>
  );
}
