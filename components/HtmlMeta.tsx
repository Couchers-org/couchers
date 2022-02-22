import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import Head from "next/head";

const HTML_META_DEFAULT_SHARE_IMAGE = "https://couchers.org/img/share.jpg";

interface HtmlMetaProps {
  title?: string;
  sharingTitle?: string;
  description?: string;
  shareImage?: string;
  noSuffix?: boolean;
}

export default function HtmlMeta({
  title,
  sharingTitle,
  description,
  shareImage = HTML_META_DEFAULT_SHARE_IMAGE,
  noSuffix,
}: HtmlMetaProps) {
  const { t } = useTranslation(GLOBAL);
  return (
    <Head>
      <title>
        {!title
          ? t("html_meta.default_title")
          : noSuffix
          ? title
          : `${title}${t("html_meta.title_suffix")}`}
      </title>

      <meta
        key="title"
        name="title"
        content={
          !sharingTitle
            ? t("html_meta.default_title")
            : noSuffix
            ? sharingTitle
            : `${sharingTitle}${t("html_meta.title_suffix")}`
        }
      />
      <meta
        key="og_title"
        property="og:title"
        content={
          !sharingTitle
            ? t("html_meta.default_title")
            : noSuffix
            ? sharingTitle
            : `${sharingTitle}${t("html_meta.title_suffix")}`
        }
      />
      <meta
        key="twitter_title"
        name="twitter:title"
        content={
          !sharingTitle
            ? t("html_meta.default_title")
            : noSuffix
            ? sharingTitle
            : `${sharingTitle}${t("html_meta.title_suffix")}`
        }
      />

      <meta key="description" name="description" content={description} />
      <meta
        key="og_description"
        property="og:description"
        content={description ?? t("html_meta.default_description")}
      />
      <meta
        key="twitter_description"
        name="twitter:description"
        content={description ?? t("html_meta.default_description")}
      />
      <meta key="og_image" property="og:image" content={shareImage} />
      <meta key="twitter_image" property="twitter:image" content={shareImage} />
    </Head>
  );
}
