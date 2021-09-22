import {
  HTML_META_DESCRIPTION,
  HTML_META_TITLE,
  HTML_META_TITLE_SUFFIX,
} from "features/constants";
import { Helmet } from "react-helmet";

interface HtmlMetaProps {
  title?: string;
  sharingTitle?: string;
  description?: string;
  noSuffix?: boolean;
}

export default function HtmlMeta(props: HtmlMetaProps) {
  const title = props.title || HTML_META_TITLE;
  const sharingTitle = props.sharingTitle || title;
  const description = props.description || HTML_META_DESCRIPTION;

  return (
    <Helmet>
      <title>
        {props.noSuffix ? title : `${title}${HTML_META_TITLE_SUFFIX}`}
      </title>

      <meta
        name="title"
        content={
          props.noSuffix
            ? sharingTitle
            : `${sharingTitle}${HTML_META_TITLE_SUFFIX}`
        }
      />
      <meta
        property="og:title"
        content={
          props.noSuffix
            ? sharingTitle
            : `${sharingTitle}${HTML_META_TITLE_SUFFIX}`
        }
      />
      <meta
        name="twitter:title"
        content={
          props.noSuffix
            ? sharingTitle
            : `${sharingTitle}${HTML_META_TITLE_SUFFIX}`
        }
      />

      <meta name="description" content={description} />
      <meta property="og:description" content={description} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
