import {
  HTML_META_DEFAULT_DESCRIPTION,
  HTML_META_DEFAULT_TITLE,
  HTML_META_TITLE_SUFFIX,
} from "features/constants";
import { Helmet } from "react-helmet-async";

interface HtmlMetaProps {
  title?: string;
  sharingTitle?: string;
  description?: string;
  noSuffix?: boolean;
}

export default function HtmlMeta({
  title = HTML_META_DEFAULT_TITLE,
  sharingTitle = title,
  description = HTML_META_DEFAULT_DESCRIPTION,
  noSuffix,
}: HtmlMetaProps) {
  return (
    <Helmet>
      <title>
        {noSuffix || title === HTML_META_DEFAULT_TITLE
          ? title
          : `${title}${HTML_META_TITLE_SUFFIX}`}
      </title>

      <meta
        name="title"
        content={
          noSuffix || sharingTitle === HTML_META_DEFAULT_TITLE
            ? sharingTitle
            : `${sharingTitle}${HTML_META_TITLE_SUFFIX}`
        }
      />
      <meta
        property="og:title"
        content={
          noSuffix || sharingTitle === HTML_META_DEFAULT_TITLE
            ? sharingTitle
            : `${sharingTitle}${HTML_META_TITLE_SUFFIX}`
        }
      />
      <meta
        name="twitter:title"
        content={
          noSuffix || sharingTitle === HTML_META_DEFAULT_TITLE
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
