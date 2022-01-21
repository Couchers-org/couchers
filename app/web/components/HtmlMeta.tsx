import {
  HTML_META_DEFAULT_DESCRIPTION,
  HTML_META_DEFAULT_SHARE_IMAGE,
  HTML_META_DEFAULT_TITLE,
  HTML_META_TITLE_SUFFIX,
} from "features/constants";
import Head from "next/head";

interface HtmlMetaProps {
  title?: string;
  sharingTitle?: string;
  description?: string;
  shareImage?: string;
  noSuffix?: boolean;
}

export default function HtmlMeta({
  title = HTML_META_DEFAULT_TITLE,
  sharingTitle = title,
  description = HTML_META_DEFAULT_DESCRIPTION,
  shareImage = HTML_META_DEFAULT_SHARE_IMAGE,
  noSuffix,
}: HtmlMetaProps) {
  return (
    <Head>
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
      <meta property="og:image" content={shareImage} />
      <meta property="twitter:image" content={shareImage} />
    </Head>
  );
}
